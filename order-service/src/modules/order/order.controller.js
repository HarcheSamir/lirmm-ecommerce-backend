const prisma = require('../../config/prisma');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const enrichOrders = async (orders) => {
  if (!orders || orders.length === 0) return [];

  const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
  let userMap = new Map();

  if (userIds.length > 0) {
    try {
        const localUsers = await prisma.denormalizedUser.findMany({
            where: { id: { in: userIds } }
        });
        localUsers.forEach(u => userMap.set(u.id, u));
    } catch (e) {
      console.error("Failed to enrich orders with denormalized user data:", e.message);
    }
  }

  const productIds = [...new Set(orders.flatMap(o => o.items.map(i => i.productId)))];
  let productMap = new Map();

  if (productIds.length > 0) {
    try {
      const localProducts = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      localProducts.forEach(p => productMap.set(p.id, p));
    } catch (e) {
      console.error("Failed to enrich orders with local product data:", e.message);
    }
  }

  return orders.map(order => {
    const user = order.userId ? userMap.get(order.userId) : null;
    const enrichedItems = order.items.map(item => {
      const product = productMap.get(item.productId);
      return {
        ...item,
        productName: product?.name || item.productName,
        sku: product?.sku || item.sku,
        imageUrl: product?.imageUrl || item.imageUrl,
      };
    });
    return {
      ...order,
      items: enrichedItems,
      customerName: user?.name || order.guestName || 'Guest',
      customerEmail: user?.email || order.guestEmail,
      customerAvatar: user?.profileImage || null
    };
  });
};

const createOrder = async (req, res, next) => {
  const { items, shippingAddress, guestEmail, guestName, phone, paymentMethod } = req.body;
  const email = req.user?.email || guestEmail;

  if (!email) {
    return next(createError('An email address is required for all orders.', 400));
  }
  if (!phone) {
    return next(createError('A phone number is required for all orders.', 400));
  }
  if (!Array.isArray(items) || items.length === 0) {
    return next(createError('Order must contain at least one item.', 400));
  }

  try {
    const productSvcUrl = "http://product-service:3003"; // Hardcoded for simplicity in this example
    if (!productSvcUrl) {
      throw createError('Product service is currently unavailable for stock adjustment.', 503);
    }

    const createdOrderId = await prisma.$transaction(async (tx) => {
      const productIds = items.map(item => item.productId);
      const localProducts = await tx.product.findMany({
        where: { id: { in: productIds } }
      });
      const localProductMap = new Map(localProducts.map(p => [p.id, p]));

      let totalAmount = 0;
      const shippingCost = 9.18;
      const initialStatus = paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID';

      const order = await tx.order.create({
        data: {
          userId: req.user?.id,
          phone: phone,
          guestEmail: req.user ? null : email,
          guestName: req.user ? null : guestName,
          shippingAddress,
          paymentMethod,
          totalAmount: 0,
          status: 'PENDING'
        }
      });

      for (const item of items) {
        const localProduct = localProductMap.get(item.productId);
        if (!localProduct) throw createError(`Product with ID ${item.productId} not found. The system may be syncing.`, 404);

        const stockAdjustUrl = `${productSvcUrl}/stock/adjust/${item.variantId}`;
        const axios = require('axios');
        await axios.post(stockAdjustUrl, {
          changeQuantity: -item.quantity,
          type: 'ORDER',
          reason: `Order placement: ${order.id}`,
          relatedOrderId: order.id
        });

        totalAmount += (item.price * item.quantity);

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: localProduct.name,
            variantAttributes: item.attributes || {},
            sku: localProduct.sku,
            imageUrl: localProduct.imageUrl,
            priceAtTimeOfOrder: item.price,
            quantity: item.quantity
          }
        });
      }

      const finalTotal = totalAmount + shippingCost;
      await tx.order.update({
        where: { id: order.id },
        data: {
          totalAmount: finalTotal,
          status: initialStatus
        }
      });

      return order.id;
    });

    const finalOrder = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { items: true }
    });

    res.status(201).json(finalOrder);
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'A downstream service failed. The order has been rolled back.';
    const status = error.statusCode || error.response?.status || 503;
    return next(createError(message, status));
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: { items: true },
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    const [enrichedOrder] = await enrichOrders([order]);
    return res.json(enrichedOrder);
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true }
      }),
      prisma.order.count()
    ]);
    const enrichedData = await enrichOrders(orders);
    res.json({
      data: enrichedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const where = { userId: req.user.id };
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true }
      }),
      prisma.order.count({ where })
    ]);
    const enrichedData = await enrichOrders(orders);
    res.json({
      data: enrichedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await prisma.order.update({
      where: { id },
      data: { status }
    });
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    const [enrichedOrder] = await enrichOrders([updatedOrder]);
    res.json(enrichedOrder);
  } catch (err) {
    next(err);
  }
};

const getGuestOrder = async (req, res, next) => {
  try {
    const { orderId, email } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ message: 'Order ID and email are required.' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, guestEmail: email },
      include: { items: true }
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or email does not match.' });
    }
    const [enrichedOrder] = await enrichOrders([order]);
    res.json(enrichedOrder);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getGuestOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};