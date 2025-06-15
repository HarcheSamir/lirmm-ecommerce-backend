// ===== FILE: product-service/src/modules/category/category.routes.js =====

const express = require('express');
const {
    createCategory,
    createManyCategories,
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
} = require('./category.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission'); // <-- NEW

const router = express.Router();

// --- Public Routes ---
router.get('/', getCategories);
router.get('/id/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);

// --- Protected Routes ---
router.post('/', authMiddleware, hasPermission('create:category'), createCategory);
router.post('/bulk', authMiddleware, hasPermission('create:category'), createManyCategories);
router.put('/:id', authMiddleware, hasPermission('update:category'), updateCategory);
router.delete('/:id', authMiddleware, hasPermission('delete:category'), deleteCategory);

module.exports = router;