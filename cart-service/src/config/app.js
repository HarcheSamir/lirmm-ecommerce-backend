const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cartRoutes = require('../modules/cart/cart.routes');
const errorHandler = require('../middlewares/errorHandler');
const { redisClient } = require('./redis'); // Import redisClient for health check

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'development') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', async (req, res) => {
    try {
        // Check Redis connection
        const pingResponse = await redisClient.ping();
        if (pingResponse !== 'PONG') {
            throw new Error('Redis ping failed');
        }
        res.status(200).json({
            status: 'UP',
            service: process.env.SERVICE_NAME,
            dependencies: {
                redis: 'UP'
            }
        });
    } catch (error) {
        console.error(`[Health Check] Failed for ${process.env.SERVICE_NAME}:`, error.message);
        res.status(503).json({
            status: 'DOWN',
            service: process.env.SERVICE_NAME,
            dependencies: {
                redis: 'DOWN'
            },
            error: error.message
        });
    }
});

// API Routes
// Mount cart routes under /
// (API Gateway will route /carts to here, so internal routes are simpler)
app.use('/', cartRoutes);


// Global Error Handler
app.use(errorHandler);

module.exports = app;
