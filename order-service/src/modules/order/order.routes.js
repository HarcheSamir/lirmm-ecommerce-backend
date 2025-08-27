// order-service/src/modules/order/order.routes.js
const express = require('express');
const {
    createOrder, cancelOrder, getGuestOrder, getMyOrders, getOrderById, getAllOrders,
    updateOrderStatus, verifyPurchase, seedGuestOrders,
    createReturnRequest, getMyReturnRequests, getAllReturnRequests, getReturnRequestById, manageReturnRequest,
    createReturnRequestComment
} = require('./order.controller');
const authMiddleware = require('../../middlewares/auth');
const optionalAuthMiddleware = require('../../middlewares/optionalAuth');
const hasPermission = require('../../middlewares/permission');
const adminOnlyMiddleware = require('../../middlewares/adminOnly');

const router = express.Router();

// --- ORDERS ---
router.post('/internal/seed-orders', seedGuestOrders);
router.post('/', optionalAuthMiddleware, createOrder);
router.post('/guest-lookup', getGuestOrder);
router.get('/:id', getOrderById);
router.get('/', getAllOrders);
router.post('/:id/cancel', optionalAuthMiddleware, cancelOrder);
router.get('/my-orders', authMiddleware, hasPermission('read:my-orders'), getMyOrders);
router.put('/:id/status', adminOnlyMiddleware, hasPermission('update:order'), updateOrderStatus);
router.get('/internal/verify-purchase', verifyPurchase);

// --- RETURNS ---
router.post('/returns', optionalAuthMiddleware, createReturnRequest);
router.get('/my-returns', authMiddleware, getMyReturnRequests);
router.get('/returns/:id', optionalAuthMiddleware, getReturnRequestById);
router.post('/returns/:id/comments', optionalAuthMiddleware, createReturnRequestComment);

// --- ADMIN RETURNS ---
router.get('/admin/returns', adminOnlyMiddleware, hasPermission('read:returns'), getAllReturnRequests);
router.put('/admin/returns/:id', adminOnlyMiddleware, hasPermission('write:returns'), manageReturnRequest);

module.exports = router;