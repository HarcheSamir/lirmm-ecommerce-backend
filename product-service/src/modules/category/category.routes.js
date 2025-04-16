const express = require('express');
const {
    createCategory,
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
} = require('./category.controller');
// const authMiddleware = require('../../middlewares/auth'); // Uncomment if auth is needed

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/id/:id', getCategoryById); // Explicitly use /id/ prefix
router.get('/slug/:slug', getCategoryBySlug); // Explicitly use /slug/ prefix

// Protected routes (example - uncomment authMiddleware)
router.post('/', /* authMiddleware, */ createCategory);
router.put('/:id', /* authMiddleware, */ updateCategory);
router.delete('/:id', /* authMiddleware, */ deleteCategory);

module.exports = router;