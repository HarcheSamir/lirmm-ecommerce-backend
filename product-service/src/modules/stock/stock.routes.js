const express = require('express');
const { adjustStock, getStockMovements } = require('./stock.controller');
// const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

// Route for adjusting stock for a specific variant
// POST /stock/adjust/:variantId
router.post('/adjust/:variantId', /* authMiddleware, */ adjustStock);

// Route for getting the history of stock movements for a variant
// GET /stock/history/:variantId
router.get('/history/:variantId', /* authMiddleware, */ getStockMovements);


module.exports = router;