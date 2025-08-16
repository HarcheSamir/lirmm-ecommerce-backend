// order-service/src/modules/order/order.controller.js
const prisma = require('../../config/prisma');
const axios = require('axios');
const { faker } = require('@faker-js/faker');
const { sendMessage } = require('../../kafka/producer');

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
  const { items, shippingAddress, guestEmail, guestName, phone, paymentMethod, overrideCreatedAt } = req.body;
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
      let totalAmount = 0;
      const orderItemsData = items.map(item => {
        if (!item.productId || !item.productName || !item.sku) {
            throw createError(`Incomplete product data for variant ${item.variantId} received from gateway.`, 500);
        }
        totalAmount += (parseFloat(item.price) * item.quantity);
        return {
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantAttributes: item.attributes || {},
          sku: item.sku,
          imageUrl: item.imageUrl,
          priceAtTimeOfOrder: item.price,
          costPriceAtTimeOfOrder: item.costPrice,
          quantity: item.quantity
        };
      });

      const creationDate = overrideCreatedAt ? new Date(overrideCreatedAt) : new Date();
      const newOrder = await prisma.order.create({
        data: {
          userId: req.user?.id,
          phone: phone,
          guestEmail: req.user ? null : email,
          guestName: req.user ? null : guestName,
          shippingAddress,
          paymentMethod,
          totalAmount: totalAmount,
          status: 'PENDING',
          createdAt: creationDate,
          updatedAt: creationDate,
          items: {
              create: orderItemsData
          }
        },
        include: { items: true }
      });

    await sendMessage('ORDER_CREATED', newOrder, newOrder.id);

    if (paymentMethod === 'CREDIT_CARD') {
        try {
            console.log(`Initiating payment for order ${newOrder.id}`);
            axios.post(`${PAYMENT_SERVICE_URL}/process`, {
              orderId: newOrder.id,
              amount: newOrder.totalAmount,
              userEmail: email
            });
        } catch (paymentError) {
            console.error(`Failed to initiate payment for order ${newOrder.id}. The order remains PENDING. Error: ${paymentError.message}`);
        }
    }

    res.status(201).json(newOrder);

  } catch (error) {
    console.error("Error creating order:", error);
    const message = error.response?.data?.message || error.message || 'An internal error occurred.';
    const status = error.statusCode || 500;
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
    
    const orderToUpdate = await prisma.order.findUnique({ where: { id } });
    if (!orderToUpdate) {
        return res.status(404).json({ message: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true }
    });
    
    if (status === 'CANCELLED' && orderToUpdate.status !== 'CANCELLED' && orderToUpdate.status !== 'FAILED') {
        await sendMessage('ORDER_CANCELLED', updatedOrder, updatedOrder.id);
    }

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

const verifyPurchase = async (req, res, next) => {
    try {
        const { userId, productId } = req.query;
        if (!userId || !productId) {
            return res.status(400).json({ message: 'userId and productId query parameters are required.' });
        }

        const orderCount = await prisma.order.count({
            where: {
                userId: userId,
                status: 'DELIVERED',
                items: {
                    some: {
                        productId: productId,
                    },
                },
            },
        });

        res.json({ verified: orderCount > 0 });
    } catch (err) {
        next(err);
    }
};

const seedGuestOrders = async (req, res, next) => {
    const count = parseInt(req.query.count, 10) || 10;
    let products = [];
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/?limit=200&inStock=true`);
        products = response.data.data.filter(p => p.isActive && p.variants && p.variants.some(v => v.stockQuantity > 0));

        if (products.length === 0) {
            return res.status(404).json({ message: 'No active, in-stock products with variants found to create orders from.' });
        }
    } catch (error) {
        return next(new Error(`Failed to fetch products: ${error.message}`));
    }

    for (let i = 0; i < count; i++) {
        try {
            const numItems = faker.number.int({ min: 1, max: 4 });
            const orderItems = [];
            let totalAmount = 0;

            const tempStockMap = new Map();
            products.forEach(p => p.variants.forEach(v => tempStockMap.set(v.id, v.stockQuantity)));

            for (let j = 0; j < numItems; j++) {
                const randomProduct = faker.helpers.arrayElement(products);
                const availableVariants = randomProduct.variants.filter(v => (tempStockMap.get(v.id) || 0) > 0);
                if (availableVariants.length === 0) continue;

                const randomVariant = faker.helpers.arrayElement(availableVariants);
                if (orderItems.some(item => item.variantId === randomVariant.id)) continue;

                const stock = tempStockMap.get(randomVariant.id);
                const quantity = faker.number.int({ min: 1, max: Math.min(stock, 3) });

                orderItems.push({
                    productId: randomProduct.id,
                    variantId: randomVariant.id,
                    productName: randomProduct.name,
                    variantAttributes: randomVariant.attributes || {},
                    sku: randomProduct.sku,
                    imageUrl: randomProduct.images.find(img => img.isPrimary)?.imageUrl || null,
                    priceAtTimeOfOrder: randomVariant.price,
                    costPriceAtTimeOfOrder: randomVariant.costPrice,
                    quantity: quantity,
                });
                totalAmount += (parseFloat(randomVariant.price) * quantity);
                tempStockMap.set(randomVariant.id, stock - quantity);
            }

            if (orderItems.length === 0) {
                failureCount++;
                errors.push("Could not form a valid order with available stock.");
                continue;
            }

            const paymentMethod = faker.helpers.arrayElement(['CREDIT_CARD', 'CASH_ON_DELIVERY']);
            let status, paymentTransactionId = null, paymentFailureReason = null;

            if (paymentMethod === 'CREDIT_CARD') {
                const isSuccess = Math.random() < 0.85; // 85% success rate for seeded CC payments
                paymentTransactionId = `seed_txn_${faker.string.uuid()}`;
                if (isSuccess) {
                    status = faker.helpers.arrayElement(['PAID', 'SHIPPED', 'DELIVERED']);
                } else {
                    status = 'FAILED';
                    paymentFailureReason = faker.helpers.arrayElement(['Insufficient funds', 'Card declined by bank', 'Invalid CVV']);
                }
            } else { // CASH_ON_DELIVERY
                status = faker.helpers.arrayElement(['PENDING', 'SHIPPED', 'DELIVERED']);
            }

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const randomPastDate = faker.date.between({ from: oneYearAgo, to: new Date() });

            await prisma.$transaction(async (tx) => {
                const order = await tx.order.create({
                    data: {
                        guestName: faker.person.fullName(),
                        guestEmail: faker.internet.email(),
                        phone: faker.phone.number(),
                        paymentMethod,
                        status,
                        totalAmount,
                        paymentTransactionId,
                        paymentFailureReason,
                        shippingAddress: {
                            street: faker.location.streetAddress(),
                            city: faker.location.city(),
                            postalCode: faker.location.zipCode(),
                            country: faker.location.country(),
                        },
                        createdAt: randomPastDate,
                        updatedAt: randomPastDate,
                        items: { create: orderItems },
                    }
                });

                for (const item of orderItems) {
                    const stockAdjustUrl = `${PRODUCT_SERVICE_URL}/stock/adjust/${item.variantId}`;
                    await axios.post(stockAdjustUrl, {
                        changeQuantity: -item.quantity,
                        type: 'ORDER',
                        reason: `Seeded order placement: ${order.id}`,
                        relatedOrderId: order.id,
                        timestamp: randomPastDate,
                    });
                }
            });

            successCount++;

        } catch (err) {
            failureCount++;
            const errorMessage = err.response?.data?.message || err.message || 'Unknown error during seeding loop';
            errors.push(`Seeding loop error: ${errorMessage}`);
            console.error(`Seeding Error:`, err);
        }
    }

    res.status(200).json({
        message: 'Order seeding process completed.',
        seeded: successCount,
        failed: failureCount,
        errors: errors.slice(0, 10), // Show first 10 errors
    });
};

module.exports = {
  createOrder,
  getGuestOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  verifyPurchase,
  seedGuestOrders
};