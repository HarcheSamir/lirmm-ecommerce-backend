// product-service/src/modules/promotion/promotion.routes.js
const express = require('express');
const {
    createPromotion,
    getActivePromotions,
    getAllPromotionsAdmin,
    getPromotionById,
    updatePromotion,
    deletePromotion,
    reorderPromotions // --- START: SURGICAL ADDITION ---
} = require('./promotion.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// --- Public Route for Frontend ---
router.get('/', getActivePromotions);

// --- Admin Routes ---
router.put('/reorder', authMiddleware, hasPermission('write:promotion'), reorderPromotions);
router.get('/all', authMiddleware, hasPermission('read:promotion'), getAllPromotionsAdmin);
router.post('/', authMiddleware, hasPermission('write:promotion'), createPromotion);
router.get('/:id', authMiddleware, hasPermission('read:promotion'), getPromotionById);
router.put('/:id', authMiddleware, hasPermission('write:promotion'), updatePromotion);
router.delete('/:id', authMiddleware, hasPermission('write:promotion'), deletePromotion);

module.exports = router;