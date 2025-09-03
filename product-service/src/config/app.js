const express = require('express');
const cors = require('cors');
const morgan = require('morgan');


const categoryRoutes = require('../modules/category/category.routes');
const productRoutes = require('../modules/product/product.routes');
const variantRoutes = require('../modules/variant/variant.routes');
const stockRoutes = require('../modules/stock/stock.routes');
const currencyRoutes = require('../modules/currency/currency.routes');
const promotionRoutes = require('../modules/promotion/promotion.routes'); // --- START: SURGICAL ADDITION ---
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});

// API Routes
app.use('/categories', categoryRoutes);
app.use('/variants', variantRoutes);
app.use('/stock', stockRoutes);
app.use('/currencies', currencyRoutes);
app.use('/promotions', promotionRoutes); // --- START: SURGICAL ADDITION ---
app.use('/', productRoutes);


// Global Error Handler - Must be the last middleware
app.use(errorHandler);

module.exports = app;