const express = require('express');
const { searchProducts } = require('./search.controller'); // Import updated controller function

const router = express.Router();

// Route for searching products
// Example: GET /products?q=phone&category=smartphones&limit=20
router.get('/products', searchProducts); // Use the updated path and handler

module.exports = router;