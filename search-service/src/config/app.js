const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const searchRoutes = require('../modules/search/search.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME});
});

// API Routes
app.use('/', searchRoutes); // Mount search routes under /search


// Global Error Handler
app.use(errorHandler);

module.exports = app;