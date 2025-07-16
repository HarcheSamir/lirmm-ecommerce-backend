// ===== FILE: product-service/src/modules/product/product.routes.js =====

const express = require('express');
const {
    createProduct,
    createManyProducts,
    getProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    addCategoriesToProduct,
    removeCategoriesFromProduct,
    addImagesToProduct,
    removeImagesFromProduct,
    resyncAllProducts,
} = require('./product.controller');
const variantRoutes = require('../variant/variant.routes');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// --- Public Routes (No Auth Required) ---
router.get('/', getProducts);
router.get('/id/:id', getProductById);
router.get('/sku/:sku', getProductBySku);

// --- Protected Routes (Auth and Permissions Required) ---
router.post('/', authMiddleware, hasPermission('create:product'), createProduct);
router.post('/bulk', createManyProducts);
router.put('/:id', authMiddleware, hasPermission('update:product'), updateProduct);
router.delete('/:id', authMiddleware, hasPermission('delete:product'), deleteProduct);

// --- Internal Routes ---
router.post('/internal/resync-products', resyncAllProducts);

// Routes for managing relationships
router.post('/:id/categories', authMiddleware, hasPermission('update:product'), addCategoriesToProduct);
router.delete('/:id/categories', authMiddleware, hasPermission('update:product'), removeCategoriesFromProduct);

router.post('/:id/images', authMiddleware, hasPermission('update:product'), addImagesToProduct);
router.delete('/:id/images', authMiddleware, hasPermission('update:product'), removeImagesFromProduct);

// Nested Variant Routes
router.use('/:productId/variants', variantRoutes);

module.exports = router;