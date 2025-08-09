const prisma = require('../../config/prisma');
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
if (!PRODUCT_SERVICE_URL) {
    console.error('FATAL: PRODUCT_SERVICE_URL environment variable is not defined.');
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
    const createdOrderId = await prisma.$transaction(async (tx) => {
      const productIds = items.map(item => item.productId);
      const localProducts = await tx.product.findMany({
        where: { id: { in: productIds } }
      });
      const localProductMap = new Map(localProducts.map(p => [p.id, p]));

      let totalAmount = 0;
      const initialStatus = paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID';
      const creationDate = overrideCreatedAt ? new Date(overrideCreatedAt) : undefined;

      const order = await tx.order.create({
        data: {
          userId: req.user?.id,
          phone: phone,
          guestEmail: req.user ? null : email,
          guestName: req.user ? null : guestName,
          shippingAddress,
          paymentMethod,
          totalAmount: 0,
          status: 'PENDING',
          createdAt: creationDate,
          updatedAt: creationDate
        }
      });

      for (const item of items) {
        const localProduct = localProductMap.get(item.productId);
        if (!localProduct) throw createError(`Product with ID ${item.productId} not found.`, 404);

        const stockAdjustUrl = `${PRODUCT_SERVICE_URL}/stock/adjust/${item.variantId}`;
        await axios.post(stockAdjustUrl, {
          changeQuantity: -item.quantity,
          type: 'ORDER',
          reason: `Order placement: ${order.id}`,
          relatedOrderId: order.id,
          timestamp: creationDate
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

      const finalTotal = totalAmount;
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
    const message = error.response?.data?.message || error.message || 'A downstream service failed.';
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

    const orderCreationPromises = [];

    for (let i = 0; i < count; i++) {
        try {
            const numItems = faker.number.int({ min: 2, max: 4 });
            const orderItems = [];
            const tempStockMap = new Map();

            for (let j = 0; j < numItems; j++) {
                const randomProduct = faker.helpers.arrayElement(products);

                const availableVariants = randomProduct.variants.filter(v => {
                    const currentStock = tempStockMap.get(v.id) ?? v.stockQuantity;
                    return currentStock > 0;
                });
                if (availableVariants.length === 0) continue;

                const randomVariant = faker.helpers.arrayElement(availableVariants);

                if (!orderItems.some(item => item.variantId === randomVariant.id)) {
                    const stock = tempStockMap.get(randomVariant.id) ?? randomVariant.stockQuantity;
                    const maxQuantity = Math.min(stock, 3);
                    const orderQuantity = faker.number.int({ min: 1, max: maxQuantity });

                    orderItems.push({
                        productId: randomProduct.id,
                        variantId: randomVariant.id,
                        quantity: orderQuantity,
                        price: randomVariant.price,
                        attributes: randomVariant.attributes,
                    });

                    tempStockMap.set(randomVariant.id, stock - orderQuantity);
                }
            }

            if (orderItems.length === 0) {
                failureCount++;
                errors.push("Could not find available in-stock products for an order.");
                continue;
            }

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const randomPastDate = faker.date.between({ from: oneYearAgo, to: new Date() });

            const mockRequest = {
                body: {
                    guestName: faker.person.fullName(),
                    guestEmail: faker.internet.email(),
                    phone: faker.phone.number(),
                    paymentMethod: faker.helpers.arrayElement(['CREDIT_CARD', 'CASH_ON_DELIVERY']),
                    shippingAddress: {
                        street: faker.location.streetAddress(),
                        city: faker.location.city(),
                        postalCode: faker.location.zipCode(),
                        country: faker.location.country(),
                    },
                    items: orderItems,
                    overrideCreatedAt: randomPastDate,
                },
                user: null
            };

            const promise = new Promise((resolve) => {
                const mockRes = {
                    status: (code) => ({
                        json: (data) => {
                            resolve({ success: code < 300, data });
                        }
                    }),
                };
                const mockNext = (err) => {
                    resolve({ success: false, data: { message: err.message } });
                };
                createOrder(mockRequest, mockRes, mockNext);
            });
            orderCreationPromises.push(promise);

        } catch (err) {
            failureCount++;
            errors.push(`Seeding loop error: ${err.message}`);
        }
    }

    const results = await Promise.all(orderCreationPromises);
    results.forEach(result => {
        if (result.success) {
            successCount++;
        } else {
            failureCount++;
            errors.push(result.data.message || 'Unknown order creation error.');
        }
    });

    res.status(200).json({
        message: 'Order seeding process completed.',
        seeded: successCount,
        failed: failureCount,
        errors: errors,
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