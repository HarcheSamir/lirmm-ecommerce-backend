const express = require('express');
const {
    createProduct,
    getProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    addCategoriesToProduct,
    removeCategoriesFromProduct,
    addImagesToProduct,
    removeImagesFromProduct,
} = require('./product.controller');
const variantRoutes = require('../variant/variant.routes'); // Import variant routes

// const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

// Core Product Routes
router.get('/', getProducts);
router.get('/id/:id', getProductById);
router.get('/sku/:sku', getProductBySku);

router.post('/', /* authMiddleware, */ createProduct);
router.put('/:id', /* authMiddleware, */ updateProduct); // Updates core product details
router.delete('/:id', /* authMiddleware, */ deleteProduct);


// Routes for managing relationships
router.post('/:id/categories', /* authMiddleware, */ addCategoriesToProduct);
router.delete('/:id/categories', /* authMiddleware, */ removeCategoriesFromProduct); // Use DELETE method with body or POST for removal

router.post('/:id/images', /* authMiddleware, */ addImagesToProduct);
router.delete('/:id/images', /* authMiddleware, */ removeImagesFromProduct); // Use DELETE method with body or POST for removal


// --- Nested Variant Routes ---
// Mount variant routes under /products/:productId/variants
// This makes variant operations relative to a specific product
router.use('/:productId/variants', variantRoutes);


module.exports = router;