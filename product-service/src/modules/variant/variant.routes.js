const express = require('express');
const {
    addVariant,
    getVariantsByProduct,
    getVariantById, // Route for getting a specific variant directly
    updateVariant,
    deleteVariant,
} = require('./variant.controller');
// const authMiddleware = require('../../middlewares/auth');

// Create a new router instance specifically for variants nested under products
// Note: ':productId' will be available from the parent router (product.routes.js)
const router = express.Router({ mergeParams: true }); // IMPORTANT: mergeParams allows access to :productId

// Routes relative to /products/:productId/variants

router.get('/', getVariantsByProduct); // Get all variants for the product
router.post('/', /* authMiddleware, */ addVariant); // Add a new variant to the product

// Routes for specific variants using variantId
router.get('/:variantId', getVariantById); // Get a single variant
router.put('/:variantId', /* authMiddleware, */ updateVariant); // Update a specific variant
router.delete('/:variantId', /* authMiddleware, */ deleteVariant); // Delete a specific variant


// NOTE: Stock adjustment routes are handled separately in stock.routes.js
// to keep concerns separate, but they could potentially be nested here too.

module.exports = router;