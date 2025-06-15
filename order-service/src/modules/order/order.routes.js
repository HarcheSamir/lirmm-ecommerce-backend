// ===== FILE: order-service/src/modules/order/order.routes.js =====
const express = require('express');
const {
    createOrder,
    getGuestOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
} = require('./order.controller');
const authMiddleware = require('../../middlewares/auth');
const optionalAuthMiddleware = require('../../middlewares/optionalAuth');
const hasPermission = require('../../middlewares/permission');
const adminOnlyMiddleware = require('../../middlewares/adminOnly'); // Using the simplified admin check

const router = express.Router();


// --- PUBLIC ROUTES ---
// ANYONE CAN DO THESE. NO TOKEN. NO AUTH.
router.post('/', optionalAuthMiddleware, createOrder); // Optional auth for logged-in users
router.post('/guest-lookup', getGuestOrder);
router.get('/:id', getOrderById); // <-- THE FUCKING MIDDLEWARE IS GONE. ANYONE CAN VIEW.


// --- PROTECTED ROUTES ---
// These require a valid token.

// This route MUST be protected because it's specific to "my" orders.
router.get('/my-orders', authMiddleware, hasPermission('read:my-orders'), getMyOrders);

// ADMIN-ONLY ROUTES
router.get('/', adminOnlyMiddleware, getAllOrders);
router.put('/:id/status', adminOnlyMiddleware, updateOrderStatus);


module.exports = router;