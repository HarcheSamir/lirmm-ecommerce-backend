// ===== FILE: order-service/src/modules/order/order.routes.js =====
const express = require('express');
const {
    createOrder,
    getGuestOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    verifyPurchase,
    seedGuestOrders
} = require('./order.controller');
const authMiddleware = require('../../middlewares/auth');
const optionalAuthMiddleware = require('../../middlewares/optionalAuth');
const hasPermission = require('../../middlewares/permission');
const adminOnlyMiddleware = require('../../middlewares/adminOnly');

const router = express.Router();

// --- INTERNAL ON-DEMAND SEEDING ROUTE ---
router.post('/internal/seed-orders', seedGuestOrders);


// --- PUBLIC ROUTES ---
router.post('/', optionalAuthMiddleware, createOrder);
router.post('/guest-lookup', getGuestOrder);
router.get('/:id', getOrderById);
router.get('/', getAllOrders);


// --- PROTECTED ROUTES ---
router.get('/my-orders', authMiddleware, hasPermission('read:my-orders'), getMyOrders);

// --- ADMIN-ONLY ROUTES ---
router.put('/:id/status', adminOnlyMiddleware, updateOrderStatus);

// --- INTERNAL SERVICE-TO-SERVICE ROUTE ---
router.get('/internal/verify-purchase', verifyPurchase);

module.exports = router;