const prisma = require('../../config/prisma');
const axios = require('axios');
const { sendMessage } = require('../../kafka/producer');
const crypto = require('crypto');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL;

const returnRequestInclude = {
    order: { include: { user: true } },
    items: { include: { orderItem: true } },
    comments: { orderBy: { createdAt: 'asc' } }
};

const orderInclude = {
  items: true,
  user: true,
  returnRequests: {
      include: { items: { include: { orderItem: true } }, comments: { orderBy: { createdAt: 'asc' } } }
  }
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isOrderCancellable = (order) => ['PENDING', 'PAID'].includes(order.status);
const isOrderReturnable = (order) => order.status === 'DELIVERED';

const formatOrderResponse = (order, lang = 'en') => {
  if (!order) return null;
  const { user, ...restOfOrder } = order;
  const items = order.items.map(item => ({
      ...item,
      productName: (item.productName && typeof item.productName === 'object')
          ? item.productName[lang] || item.productName['en']
          : item.productName
  }));
  return {
    ...restOfOrder,
    items,
    isCancellable: isOrderCancellable(order),
    isReturnable: isOrderReturnable(order),
    customerName: user?.name || order.guestName || 'Guest',
    customerEmail: user?.email || order.guestEmail,
    customerAvatar: user?.profileImage || null
  };
};

const formatReturnRequestResponse = (returnRequest) => {
    if (!returnRequest) return null;
    const { order, ...rest } = returnRequest;
    return { ...rest, customerName: order.user?.name || order.guestName, customerEmail: order.user?.email || order.guestEmail, phone: order.phone };
};

const createOrder = async (req, res, next) => {
  const { items, shippingAddress, guestEmail, guestName, phone, paymentMethod } = req.body;
  const email = req.user?.email || guestEmail;
  const lang = req.headers['accept-language']?.split(',')[0] || 'en';
  const displayCurrency = req.headers['x-currency']?.toUpperCase() || 'USD';

  if (!email || !phone || !Array.isArray(items) || items.length === 0) {
      return next(createError('Email, phone, and at least one item are required.', 400));
  }
  
  try {
      let baseTotalAmount = 0;
      const orderItemsData = [];

      for(const item of items) {
          if (!item.productId || !item.productName || !item.sku || item.baseCurrency === undefined || item.price === undefined ) {
              throw createError(`Incomplete product data for variant ${item.variantId} received.`, 500);
          }
          baseTotalAmount += (parseFloat(item.price) * item.quantity);
          orderItemsData.push({
              productId: item.productId, variantId: item.variantId, productName: item.productName,
              variantAttributes: item.attributes || {}, sku: item.sku, imageUrl: item.imageUrl,
              priceAtTimeOfOrder: item.price, costPriceAtTimeOfOrder: item.costPrice, quantity: item.quantity
          });
      }

      let exchangeRate = 1.0;
      if (displayCurrency !== 'USD') {
        try {
            const { data: rateData } = await axios.get(`${PRODUCT_SERVICE_URL}/currencies/internal/rates/${displayCurrency}`);
            exchangeRate = rateData.rateVsBase;
        } catch (e) {
            console.error(`Failed to fetch exchange rate for ${displayCurrency}. Defaulting to base.`);
            return next(createError(`Currency '${displayCurrency}' is not supported.`, 400));
        }
      }

      const displayTotalAmount = baseTotalAmount * parseFloat(exchangeRate);
      
      const newOrder = await prisma.order.create({
        data: {
          userId: req.user?.id, phone: phone, guestEmail: req.user ? null : email, guestName: req.user ? null : guestName,
          guest_token: req.user ? null : crypto.randomBytes(32).toString('hex'),
          shippingAddress, paymentMethod, status: 'PENDING',
          totalAmount: baseTotalAmount,
          displayCurrency: displayCurrency,
          exchangeRateAtPurchase: exchangeRate,
          displayTotalAmount: displayTotalAmount,
          items: { create: orderItemsData }
        },
        include: orderInclude
      });

    const eventPayload = { ...newOrder, customerEmail: newOrder.user?.email || newOrder.guestEmail };
    await sendMessage('ORDER_CREATED', eventPayload, newOrder.id);

    if (paymentMethod === 'CREDIT_CARD') {
        axios.post(`${PAYMENT_SERVICE_URL}/process`, {
          orderId: newOrder.id, amount: newOrder.totalAmount, userEmail: email
        }).catch(e => console.error(`Payment initiation failed for order ${newOrder.id}: ${e.message}`));
    }
    res.status(201).json(formatOrderResponse(newOrder, lang));
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return next(createError(message, error.statusCode || 500));
  }
};

const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { guest_token } = req.query;
        const lang = req.headers['accept-language']?.split(',')[0] || 'en';
        let orderToCancel;
        if (req.user) {
            orderToCancel = await prisma.order.findFirst({ where: { id, userId: req.user.id } });
        } else if (guest_token) {
            orderToCancel = await prisma.order.findFirst({ where: { id, guest_token } });
        } else {
            return res.status(401).json({ message: 'Authentication is required.' });
        }
        
        if (!orderToCancel) { return res.status(404).json({ message: 'Order not found or permission denied.' }); }
        if (!isOrderCancellable(orderToCancel)) { return res.status(409).json({ message: `Order cannot be cancelled. Status: '${orderToCancel.status}'.` }); }
        
        const originalStatus = orderToCancel.status;
        const updatedOrder = await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' }, include: orderInclude });

        const eventPayload = { ...updatedOrder, customerEmail: updatedOrder.user?.email || updatedOrder.guestEmail };
        await sendMessage('ORDER_CANCELLED', eventPayload, updatedOrder.id);
        
        if (originalStatus === 'PAID' && updatedOrder.paymentTransactionId) {
            axios.post(`${PAYMENT_SERVICE_URL}/refund`, {
                orderId: updatedOrder.id, amount: updatedOrder.totalAmount, originalTransactionId: updatedOrder.paymentTransactionId
            }).catch(e => console.error(`CRITICAL: Refund trigger failed for order ${updatedOrder.id}: ${e.message}`));
        }
        res.json(formatOrderResponse(updatedOrder, lang));
    } catch (err) { next(err); }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lang = req.headers['accept-language']?.split(',')[0] || 'en';
    const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) { return res.status(404).json({ message: 'Order not found.' }); }
    return res.json(formatOrderResponse(order, lang));
  } catch (err) { next(err); }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const lang = req.headers['accept-language']?.split(',')[0] || 'en';
    const skip = (page - 1) * limit;
    const { status, paymentMethod, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } }, { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } },
        { items: { some: { productName: { path: [lang], string_contains: search, mode: 'insensitive' } } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }, { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    const orderBy = { [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' };
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({ where, skip, take: limit, orderBy, include: orderInclude }),
      prisma.order.count({ where })
    ]);
    const formattedData = orders.map(order => formatOrderResponse(order, lang));
    res.json({ data: formattedData, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, });
  } catch (err) { next(err); }
};

const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const lang = req.headers['accept-language']?.split(',')[0] || 'en';
    const skip = (page - 1) * limit;
    const where = { userId: req.user.id };
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: orderInclude }),
      prisma.order.count({ where })
    ]);
    const formattedData = orders.map(order => formatOrderResponse(order, lang));
    res.json({ data: formattedData, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const getGuestOrder = async (req, res, next) => {
  try {
    const { orderId, email, token } = req.body;
    const lang = req.headers['accept-language']?.split(',')[0] || 'en';
    let order;
    if (token) {
        order = await prisma.order.findFirst({ where: { id: orderId, guest_token: token }, include: orderInclude });
    } else if (orderId && email) {
        order = await prisma.order.findFirst({ where: { id: orderId, guestEmail: email }, include: orderInclude });
    } else {
        return res.status(400).json({ message: 'Order ID and email/token are required.' });
    }
    if (!order) { return res.status(404).json({ message: 'Order not found or credentials do not match.' }); }
    res.json(formatOrderResponse(order, lang));
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const lang = req.headers['accept-language']?.split(',')[0] || 'en';
    if (!await prisma.order.findUnique({ where: { id } })) { return res.status(404).json({ message: 'Order not found' }); }
    if (status === 'CANCELLED') { return res.status(400).json({ message: 'Use the dedicated cancellation endpoint to cancel an order.'}); }
    const updatedOrder = await prisma.order.update({ where: { id }, data: { status }, include: orderInclude });
    res.json(formatOrderResponse(updatedOrder, lang));
  } catch (err) { next(err); }
};

const verifyPurchase = async (req, res, next) => {
    try {
        const { userId, productId } = req.query;
        if (!userId || !productId) { return res.status(400).json({ message: 'userId and productId are required.' }); }
        const count = await prisma.order.count({ where: { userId, status: 'DELIVERED', items: { some: { productId } } } });
        res.json({ verified: count > 0 });
    } catch (err) { next(err); }
};

const createReturnRequest = async (req, res, next) => {
    try {
        const { orderId, reason, items, imageUrls } = req.body;
        const { guest_token } = req.query;
        if (!Array.isArray(items) || items.length === 0) { return res.status(400).json({ message: 'At least one item is required.' }); }
        let order;
        if (req.user) {
            order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id }, include: { items: true } });
        } else if (guest_token) {
            order = await prisma.order.findFirst({ where: { id: orderId, guest_token }, include: { items: true } });
        } else {
            return res.status(401).json({ message: 'Authentication is required.' });
        }
        if (!order) { return res.status(404).json({ message: 'Order not found or permission denied.' }); }
        if (!isOrderReturnable(order)) { return res.status(409).json({ message: `Order status '${order.status}' is not returnable.` }); }
        if (await prisma.returnRequest.findFirst({ where: { orderId } })) { return res.status(409).json({ message: `A return request for this order already exists.` }); }
        
        const returnItemsData = items.map(item => {
            const orderItem = order.items.find(oi => oi.id === item.orderItemId);
            if (!orderItem || item.quantity > orderItem.quantity) { throw createError(`Invalid item or quantity for ${item.orderItemId}.`, 400); }
            return { orderItemId: item.orderItemId, quantity: item.quantity };
        });
        
        const newReturnRequest = await prisma.returnRequest.create({
            data: { orderId, reason, imageUrls, items: { create: returnItemsData } },
            include: returnRequestInclude
        });
        await sendMessage('RETURN_REQUEST_CREATED', formatReturnRequestResponse(newReturnRequest), newReturnRequest.id);
        res.status(201).json(formatReturnRequestResponse(newReturnRequest));
    } catch (err) { next(err); }
};

const getMyReturnRequests = async (req, res, next) => {
    try {
        const requests = await prisma.returnRequest.findMany({ where: { order: { userId: req.user.id } }, orderBy: { createdAt: 'desc' }, include: returnRequestInclude });
        res.json(requests.map(formatReturnRequestResponse));
    } catch (err) { next(err); }
};

const getAllReturnRequests = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1, limit = parseInt(req.query.limit, 10) || 10, skip = (page - 1) * limit;
        const { status, search } = req.query;
        const where = {};
        if (status) where.status = status;
        if (search) { where.OR = [ { id: { contains: search, mode: 'insensitive' } }, { orderId: { contains: search, mode: 'insensitive' } } ]; }
        const [requests, total] = await prisma.$transaction([
            prisma.returnRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: returnRequestInclude }),
            prisma.returnRequest.count({ where })
        ]);
        res.json({ data: requests.map(formatReturnRequestResponse), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
};

const getReturnRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await prisma.returnRequest.findUnique({ where: { id }, include: returnRequestInclude });
        if (!request) { return res.status(404).json({ message: 'Return request not found.' }); }
        if (req.user && req.user.role !== 'ADMIN' && request.order.userId !== req.user.id) { return res.status(403).json({ message: 'Forbidden.' }); }
        res.json(formatReturnRequestResponse(request));
    } catch (err) { next(err); }
};

const manageReturnRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminComments } = req.body;
        const updatedRequest = await prisma.returnRequest.update({
            where: { id }, data: { status, adminComments }, include: returnRequestInclude
        });
        if (!updatedRequest) { return res.status(404).json({ message: 'Return request not found.' }); }

        const eventPayload = formatReturnRequestResponse(updatedRequest);
        if (status === 'APPROVED') { await sendMessage('RETURN_REQUEST_APPROVED', eventPayload, id); }
        if (status === 'REJECTED') { await sendMessage('RETURN_REQUEST_REJECTED', eventPayload, id); }
        if (status === 'COMPLETED') {
            await sendMessage('RETURN_REQUEST_COMPLETED', eventPayload, id);
            if (updatedRequest.order.paymentMethod === 'CREDIT_CARD' && updatedRequest.order.paymentTransactionId) {
                axios.post(`${PAYMENT_SERVICE_URL}/refund`, {
                    orderId: updatedRequest.orderId, amount: updatedRequest.order.totalAmount, originalTransactionId: updatedRequest.order.paymentTransactionId
                }).catch(e => console.error(`CRITICAL: Refund trigger failed for return ${id}: ${e.message}`));
            }
            for (const item of updatedRequest.items) {
                axios.post(`${PRODUCT_SERVICE_URL}/stock/adjust/${item.orderItem.variantId}`, {
                    changeQuantity: item.quantity, type: 'RETURN_RESTOCK', reason: `Return request completed: ${id}`, relatedOrderId:updatedRequest.orderId,
                }).catch(e => console.error(`CRITICAL: Stock restock failed for return ${id}, variant ${item.orderItem.variantId}: ${e.message}`));
            }
        }
        res.json(formatReturnRequestResponse(updatedRequest));
    } catch (err) { next(err); }
};

const createReturnRequestComment = async (req, res, next) => {
    try {
        const { id: returnRequestId } = req.params;
        const { commentText, imageUrl } = req.body;
        const { guest_token } = req.query;
        if (!commentText && !imageUrl) { return res.status(400).json({ message: 'Comment must contain text or an image.' }); }
        let returnRequest;
        if (req.user) {
            returnRequest = req.user.role === 'ADMIN'
                ? await prisma.returnRequest.findUnique({ where: { id: returnRequestId }, include: { order: { include: { user: true } } } })
                : await prisma.returnRequest.findFirst({ where: { id: returnRequestId, order: { userId: req.user.id } }, include: { order: { include: { user: true } } } });
        } else if (guest_token) {
            returnRequest = await prisma.returnRequest.findFirst({ where: { id: returnRequestId, order: { guest_token }}, include: { order: { include: { user: true } } } });
        } else {
            return res.status(401).json({ message: 'Authentication is required.' });
        }
        if (!returnRequest) { return res.status(404).json({ message: 'Return request not found or permission denied.' }); }

        const newComment = await prisma.returnRequestComment.create({
            data: { returnRequestId, commentText, imageUrl, authorId: req.user ? req.user.id : null, authorName: req.user ? req.user.name : 'Guest' }
        });
        const updatedRequest = await prisma.returnRequest.update({
            where: { id: returnRequestId },
            data: { status: (req.user && req.user.role === 'ADMIN') ? 'AWAITING_CUSTOMER_RESPONSE' : undefined },
            include: returnRequestInclude
        });

        const formattedReturnRequest = formatReturnRequestResponse(updatedRequest);
        formattedReturnRequest.guest_token = updatedRequest.order.guest_token;

        await sendMessage('RETURN_REQUEST_COMMENT_ADDED', { returnRequest: formattedReturnRequest, ...newComment }, returnRequestId);
        res.status(201).json(newComment);
    } catch (err) { next(err); }
};

// --- SURGICALLY ADDED MISSING FUNCTION ---
const seedGuestOrders = async (req, res, next) => {
    // This is a placeholder as the original logic was not provided.
    // It is now a valid function that prevents the server crash.
    console.log('Received request to seed guest orders. This functionality is a placeholder.');
    res.status(200).json({ message: 'Seed request received (placeholder implementation).' });
};
// --- END SURGICAL ADDITION ---

module.exports = {
  createOrder,
  cancelOrder,
  getOrderById,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  getGuestOrder,
  verifyPurchase,
  createReturnRequest,
  getMyReturnRequests,
  getAllReturnRequests,
  getReturnRequestById,
  manageReturnRequest,
  createReturnRequestComment,
  seedGuestOrders, // --- SURGICALLY ADDED TO EXPORTS ---
};