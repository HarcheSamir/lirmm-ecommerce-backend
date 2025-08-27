// order-service/src/modules/order/order.controller.js
const prisma = require('../../config/prisma');
const axios = require('axios');
const { faker } = require('@faker-js/faker');
const { sendMessage } = require('../../kafka/producer');
const crypto = require('crypto');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL;

if (!PRODUCT_SERVICE_URL) {
    console.error('FATAL: PRODUCT_SERVICE_URL environment variable is not defined.');
    process.exit(1);
}
if (!PAYMENT_SERVICE_URL) {
    console.error('FATAL: PAYMENT_SERVICE_URL environment variable is not defined.');
    process.exit(1);
}

const returnRequestInclude = {
    order: { include: { user: true } },
    items: { include: { orderItem: true } },
    comments: { orderBy: { createdAt: 'asc' } }
};

const orderInclude = {
  items: true,
  user: true,
  returnRequests: {
      include: {
          items: { include: { orderItem: true } },
          comments: { orderBy: { createdAt: 'asc' } }
      }
  }
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isOrderCancellable = (order) => {
    if (!order) return false;
    return ['PENDING', 'PAID'].includes(order.status);
};

const isOrderReturnable = (order) => {
    if (!order) return false;
    return order.status === 'DELIVERED';
};

const formatOrderResponse = (order) => {
  if (!order) return null;
  const { user, ...restOfOrder } = order;
  return {
    ...restOfOrder,
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
    return {
        ...rest,
        customerName: order.user?.name || order.guestName || 'Guest',
        customerEmail: order.user?.email || order.guestEmail,
        phone: order.phone,
    };
};

const createOrder = async (req, res, next) => {
  const { items, shippingAddress, guestEmail, guestName, phone, paymentMethod, overrideCreatedAt } = req.body;
  const email = req.user?.email || guestEmail;
  if (!email) { return next(createError('An email address is required for all orders.', 400)); }
  if (!phone) { return next(createError('A phone number is required for all orders.', 400)); }
  if (!Array.isArray(items) || items.length === 0) { return next(createError('Order must contain at least one item.', 400)); }
  try {
      let totalAmount = 0;
      const orderItemsData = items.map(item => {
        if (!item.productId || !item.productName || !item.sku) { throw createError(`Incomplete product data for variant ${item.variantId} received from gateway.`, 500); }
        totalAmount += (parseFloat(item.price) * item.quantity);
        return {
          productId: item.productId, variantId: item.variantId, productName: item.productName,
          variantAttributes: item.attributes || {}, sku: item.sku, imageUrl: item.imageUrl,
          priceAtTimeOfOrder: item.price, costPriceAtTimeOfOrder: item.costPrice, quantity: item.quantity
        };
      });
      const creationDate = overrideCreatedAt ? new Date(overrideCreatedAt) : new Date();
      const newOrder = await prisma.order.create({
        data: {
          userId: req.user?.id, phone: phone, guestEmail: req.user ? null : email, guestName: req.user ? null : guestName,
          guest_token: req.user ? null : crypto.randomBytes(32).toString('hex'), shippingAddress, paymentMethod,
          totalAmount: totalAmount, status: 'PENDING', createdAt: creationDate, updatedAt: creationDate,
          items: { create: orderItemsData }
        },
        include: { items: true, user: true }
      });
    const eventPayload = { ...newOrder, customerEmail: newOrder.user?.email || newOrder.guestEmail, guest_token: newOrder.guest_token };
    await sendMessage('ORDER_CREATED', eventPayload, newOrder.id);
    if (paymentMethod === 'CREDIT_CARD') {
        try {
            axios.post(`${PAYMENT_SERVICE_URL}/process`, {
              orderId: newOrder.id, amount: newOrder.totalAmount, userEmail: email
            });
        } catch (paymentError) { console.error(`Failed to initiate payment for order ${newOrder.id}. The order remains PENDING. Error: ${paymentError.message}`); }
    }
    res.status(201).json(formatOrderResponse(newOrder));
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'An internal error occurred.';
    const status = error.statusCode || 500;
    return next(createError(message, status));
  }
};

const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { guest_token } = req.query;
        const user = req.user;
        let orderToCancel;
        if (user) {
            orderToCancel = await prisma.order.findFirst({ where: { id, userId: user.id } });
            if (!orderToCancel) { return res.status(404).json({ message: 'Order not found or you do not have permission to cancel it.' }); }
        } else if (guest_token) {
            orderToCancel = await prisma.order.findFirst({ where: { id, guest_token: guest_token } });
            if (!orderToCancel) { return res.status(404).json({ message: 'Order not found or cancellation token is invalid.' }); }
        } else {
            return res.status(401).json({ message: 'Authentication is required to cancel an order.' });
        }
        if (!isOrderCancellable(orderToCancel)) { return res.status(409).json({ message: `Order cannot be cancelled. Its current status is '${orderToCancel.status}'.` }); }
        const originalStatus = orderToCancel.status;
        const updatedOrder = await prisma.order.update({
            where: { id }, data: { status: 'CANCELLED' }, include: { items: true, user: true }
        });
        const eventPayload = { ...updatedOrder, customerEmail: updatedOrder.user?.email || updatedOrder.guestEmail };
        await sendMessage('ORDER_CANCELLED', eventPayload, updatedOrder.id);
        if (originalStatus === 'PAID' && updatedOrder.paymentTransactionId) {
            axios.post(`${PAYMENT_SERVICE_URL}/refund`, {
                orderId: updatedOrder.id, amount: updatedOrder.totalAmount, originalTransactionId: updatedOrder.paymentTransactionId
            }).catch(refundError => { console.error(`CRITICAL: Failed to initiate refund for order ${updatedOrder.id}. Manual refund required. Error: ${refundError.message}`); });
        }
        res.json(formatOrderResponse(updatedOrder));
    } catch (err) { next(err); }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: orderInclude,
    });
    if (!order) { return res.status(404).json({ message: 'Order not found.' }); }
    return res.json(formatOrderResponse(order));
  } catch (err) { next(err); }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, paymentMethod, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } }, { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } },
        { items: { some: { productName: { contains: search, mode: 'insensitive' } } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }, { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    const orderBy = {};
    const validSortFields = ['createdAt', 'updatedAt', 'totalAmount'];
    if (validSortFields.includes(sortBy)) { orderBy[sortBy] = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
    } else { orderBy['createdAt'] = 'desc'; }
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({ where, skip, take: limit, orderBy, include: { items: true, user: true } }),
      prisma.order.count({ where })
    ]);
    const formattedData = orders.map(formatOrderResponse);
    res.json({ data: formattedData, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, });
  } catch (err) { next(err); }
};

const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const where = { userId: req.user.id };
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { items: true, user: true } }),
      prisma.order.count({ where })
    ]);
    const formattedData = orders.map(formatOrderResponse);
    res.json({ data: formattedData, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orderToUpdate = await prisma.order.findUnique({ where: { id } });
    if (!orderToUpdate) { return res.status(404).json({ message: 'Order not found' }); }
    if (status === 'CANCELLED') { return res.status(400).json({ message: 'To cancel an order, please use the dedicated cancellation endpoint.'}); }
    const updatedOrder = await prisma.order.update({
      where: { id }, data: { status }, include: { items: true, user: true }
    });
    res.json(formatOrderResponse(updatedOrder));
  } catch (err) { next(err); }
};

const getGuestOrder = async (req, res, next) => {
  try {
    const { orderId, email, token } = req.body;
    let order;
    if (token) {
        order = await prisma.order.findFirst({
            where: { id: orderId, guest_token: token },
            include: orderInclude
        });
        if (!order) { return res.status(404).json({ message: 'Order not found or token is invalid.' }); }
    } else if (orderId && email) {
        order = await prisma.order.findFirst({
            where: { id: orderId, guestEmail: email },
            include: orderInclude
        });
        if (!order) { return res.status(404).json({ message: 'Order not found or email does not match.' }); }
    } else {
        return res.status(400).json({ message: 'Order ID and email/token are required.' });
    }
    res.json(formatOrderResponse(order));
  } catch (err) { next(err); }
};

const verifyPurchase = async (req, res, next) => {
    try {
        const { userId, productId } = req.query;
        if (!userId || !productId) { return res.status(400).json({ message: 'userId and productId query parameters are required.' }); }
        const orderCount = await prisma.order.count({ where: { userId: userId, status: 'DELIVERED', items: { some: { productId: productId } } } });
        res.json({ verified: orderCount > 0 });
    } catch (err) { next(err); }
};

const createReturnRequest = async (req, res, next) => {
    try {
        const { orderId, reason, items, imageUrls } = req.body;
        const { guest_token } = req.query;
        const user = req.user;
        if (!Array.isArray(items) || items.length === 0) { return res.status(400).json({ message: 'You must specify at least one item to return.' }); }
        let order;
        if (user) {
            order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } });
        } else if (guest_token) {
            order = await prisma.order.findFirst({ where: { id: orderId, guest_token: guest_token }, include: { items: true } });
        } else {
            return res.status(401).json({ message: 'Authentication is required.' });
        }
        if (!order) { return res.status(404).json({ message: 'Order not found or you do not have permission to access it.' }); }
        if (!isOrderReturnable(order)) { return res.status(409).json({ message: `Order cannot be returned. Its current status is '${order.status}'.` }); }
        const existingRequest = await prisma.returnRequest.findFirst({ where: { orderId: orderId } });
        if (existingRequest) { return res.status(409).json({ message: `A return request for order ${orderId} already exists.` }); }
        const returnItemsData = [];
        for (const item of items) {
            const orderItem = order.items.find(oi => oi.id === item.orderItemId);
            if (!orderItem) { return res.status(400).json({ message: `Item with ID ${item.orderItemId} is not part of this order.` }); }
            if (item.quantity > orderItem.quantity) { return res.status(400).json({ message: `Cannot return more items than were purchased for ${orderItem.productName}.`}); }
            returnItemsData.push({ orderItemId: item.orderItemId, quantity: item.quantity });
        }
        const newReturnRequest = await prisma.returnRequest.create({
            data: { orderId, reason, imageUrls, items: { create: returnItemsData } },
            include: returnRequestInclude
        });
        const eventPayload = formatReturnRequestResponse(newReturnRequest);
        await sendMessage('RETURN_REQUEST_CREATED', eventPayload, newReturnRequest.id);
        res.status(201).json(formatReturnRequestResponse(newReturnRequest));
    } catch (err) { next(err); }
};

const getMyReturnRequests = async (req, res, next) => {
    try {
        const where = { order: { userId: req.user.id } };
        const returnRequests = await prisma.returnRequest.findMany({ where, orderBy: { createdAt: 'desc' }, include: returnRequestInclude });
        res.json(returnRequests.map(formatReturnRequestResponse));
    } catch (err) { next(err); }
};

const getAllReturnRequests = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const { status, search } = req.query;
        const where = {};
        if (status) where.status = status;
        if (search) {
          where.OR = [
            { id: { contains: search, mode: 'insensitive' } }, { orderId: { contains: search, mode: 'insensitive' } },
            { order: { guestName: { contains: search, mode: 'insensitive' } } }, { order: { user: { name: { contains: search, mode: 'insensitive' } } } }
          ];
        }
        const [requests, total] = await prisma.$transaction([
            prisma.returnRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: returnRequestInclude }),
            prisma.returnRequest.count({ where })
        ]);
        const formattedData = requests.map(formatReturnRequestResponse);
        res.json({ data: formattedData, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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
                    changeQuantity: item.quantity, type: 'RETURN_RESTOCK', reason: `Return request approved: ${id}`, relatedOrderId: updatedRequest.orderId,
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
        const user = req.user;

        if (!commentText && !imageUrl) {
            return res.status(400).json({ message: 'Comment must contain either text or an image.' });
        }

        let returnRequest;
        if (user) {
            if (user.role === 'ADMIN') {
                returnRequest = await prisma.returnRequest.findUnique({ where: { id: returnRequestId }, include: { order: { include: { user: true } } } });
            } else {
                returnRequest = await prisma.returnRequest.findFirst({ where: { id: returnRequestId, order: { userId: user.id } }, include: { order: { include: { user: true } } } });
            }
        } else if (guest_token) {
            returnRequest = await prisma.returnRequest.findFirst({ where: { id: returnRequestId, order: { guest_token: guest_token } }, include: { order: { include: { user: true } } } });
        } else {
            return res.status(401).json({ message: 'Authentication is required.' });
        }
        if (!returnRequest) { return res.status(404).json({ message: 'Return request not found or you do not have permission to comment on it.' }); }

        const newComment = await prisma.returnRequestComment.create({
            data: { returnRequestId, commentText, imageUrl, authorId: user ? user.id : null, authorName: user ? user.name : 'Guest' }
        });

        const updatedRequest = await prisma.returnRequest.update({ 
            where: { id: returnRequestId }, 
            data: { status: (user && user.role === 'ADMIN') ? 'AWAITING_CUSTOMER_RESPONSE' : undefined },
            include: returnRequestInclude
        });
        
        const formattedReturnRequest = formatReturnRequestResponse(updatedRequest);
        formattedReturnRequest.guest_token = updatedRequest.order.guest_token;

        const eventPayload = {
            returnRequest: formattedReturnRequest,
            authorName: newComment.authorName,
            commentText: newComment.commentText,
            imageUrl: newComment.imageUrl
        };
        
        await sendMessage('RETURN_REQUEST_COMMENT_ADDED', eventPayload, returnRequestId);
        res.status(201).json(newComment);
    } catch (err) { next(err); }
};

const seedGuestOrders = async (req, res, next) => {
    // This is a placeholder for your existing function.
};

module.exports = {
  createOrder, cancelOrder, getOrderById, getAllOrders, getMyOrders, updateOrderStatus, getGuestOrder, verifyPurchase, seedGuestOrders,
  createReturnRequest, getMyReturnRequests, getAllReturnRequests, getReturnRequestById, manageReturnRequest,
  createReturnRequestComment,
};