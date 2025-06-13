const express = require('express');
const cors = require('cors');
const morgan = require('morgan');


const categoryRoutes = require('../modules/category/category.routes');
const productRoutes = require('../modules/product/product.routes');
const variantRoutes = require('../modules/variant/variant.routes');
const stockRoutes = require('../modules/stock/stock.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors()); // Configure CORS appropriately for production
app.use(express.json({ limit: '50mb' }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
    // TODO: Add database connection check if needed
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});

// API Routes
app.use('/categories', categoryRoutes);
app.use('/', productRoutes);
app.use('/variants', variantRoutes); // Routes for direct variant manipulation if needed (e.g., stock)
app.use('/stock', stockRoutes);     // Routes specifically for stock movements


// Global Error Handler - Must be the last middleware
app.use(errorHandler);

module.exports = app;