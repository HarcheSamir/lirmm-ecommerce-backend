// ===== FILE: order-service/src/modules/order/order.controller.js =====
const prisma = require('../../config/prisma');
const { findService } = require('../../config/consul');
const axios = require('axios');

const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const createOrder = async (req, res, next) => {
    const { items, shippingAddress, guestEmail } = req.body;
    const orderPlacer = { userId: req.user?.id, email: req.user?.email || guestEmail };
    if (!orderPlacer.email) { return next(createError('An email address is required.', 400)); }
    if (!Array.isArray(items) || items.length === 0) { return next(createError('Order must contain at least one item.', 400)); }

    try {
        const productSvcUrl = await findService('product-service');
        if (!productSvcUrl) { throw createError('Product service is currently unavailable.', 503); }

        const createdOrderId = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const order = await tx.order.create({ data: { userId: orderPlacer.userId, guestEmail: orderPlacer.email, status: 'PENDING', shippingAddress, totalAmount: 0 } });
            for (const item of items) {
                const stockAdjustUrl = `${productSvcUrl}/stock/adjust/${item.variantId}`;
                await axios.post(stockAdjustUrl, { changeQuantity: -item.quantity, type: 'ORDER', reason: `Order placement: ${order.id}`, relatedOrderId: order.id }, { timeout: 7000 });
                totalAmount += (item.price * item.quantity);
                await tx.orderItem.create({ data: { orderId: order.id, productId: item.productId, variantId: item.variantId, productName: item.name || 'N/A', variantAttributes: item.attributes || {}, sku: item.sku || 'N/A', priceAtTimeOfOrder: item.price, quantity: item.quantity } });
            }
            await tx.order.update({ where: { id: order.id }, data: { totalAmount, status: 'PAID' } });
            return order.id;
        });

        const finalOrder = await prisma.order.findUnique({ where: { id: createdOrderId }, include: { items: true } });
        res.status(201).json(finalOrder);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || 'A downstream service failed. The order has been rolled back.';
            const status = error.response?.status || 503;
            return next(createError(message, status));
        }
        return next(error);
    }
};

const getGuestOrder = async (req, res, next) => {
    try {
        const { orderId, email } = req.body;
        if (!orderId || !email) { return res.status(400).json({ message: 'Order ID and email are required.' }); }
        const order = await prisma.order.findFirst({ where: { id: orderId, guestEmail: email }, include: { items: true } });
        if (!order) { return res.status(404).json({ message: 'Order not found or email does not match.' }); }
        res.json(order);
    } catch(err) { next(err); }
};

// --- MODIFIED FUNCTION ---
const getMyOrders = async (req, res, next) => {
    try {
        // 1. Get pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Define the where clause for this user's orders
        const where = { userId: req.user.id };

        // 2. Use a transaction to fetch data and total count in parallel
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
        
        // 3. Format the response exactly like the other services
        res.json({
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch(err) {
        next(err);
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
        return res.json(order);
    } catch (err) {
        next(err);
    }
};

// --- MODIFIED FUNCTION ---
const getAllOrders = async(req, res, next) => {
    try {
        // 1. Get pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 2. Use a transaction to fetch data and total count in parallel
        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { items: true }
            }),
            prisma.order.count()
        ]);
        
        // 3. Format the response exactly like the other services
        res.json({
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch(err) {
        next(err);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const updatedOrder = await prisma.order.update({ where: { id: req.params.id }, data: { status }, include: { items: true } });
        res.json(updatedOrder);
    } catch (err) { next(err); }
};

module.exports = { createOrder, getGuestOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };