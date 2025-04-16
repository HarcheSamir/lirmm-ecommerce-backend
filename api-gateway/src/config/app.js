const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
// Assuming consul discovery helper is in ./consul relative to this file
const { findService } = require('./consul');
// Assuming error handler is in ../middlewares/errorHandler relative to this file
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(morgan('dev'));

// Root Route
app.get('/', (req, res) => {
    res.json({ message: `${process.env.SERVICE_NAME} API ` });
});


app.get('/health', (req, res) => {
    // TODO: Add database connection check if needed
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME});
});

// Create proxy configuration dynamically
const createDynamicProxy = (serviceName) => {
    return createProxyMiddleware({
        router: async (req) => {
            const targetUrl = await findService(serviceName);
            if (!targetUrl) {
                 const serviceUnavailableError = new Error(`Service '${serviceName}' unavailable.`);
                 serviceUnavailableError.statusCode = 503;
                 throw serviceUnavailableError;
            }
            // console.log(`[API Gateway] Routing to ${serviceName} at ${targetUrl}`); // Logging moved to findService
            return targetUrl;
        },
        changeOrigin: true,
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        onError: (err, req, res, next) => {
             console.error(`[API Gateway] Proxy/Router Error for ${serviceName}:`, err.message);
             const proxyError = new Error();
             proxyError.message = err.message || `Error connecting to service '${serviceName}'.`;
             if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                 proxyError.statusCode = 503;
                 proxyError.message = `Service '${serviceName}' is unreachable.`;
             } else {
                 proxyError.statusCode = err.statusCode || 500;
             }
             proxyError.message = `Proxy Error: ${proxyError.message}`;
             next(proxyError);
        }
        // Optional: pathRewrite
        // pathRewrite: { [`^/api/${serviceName.replace('-service', '')}`]: '', },
    });
};


// Setup dynamic proxies (These come AFTER the /health route)
app.use('/auth', createDynamicProxy('auth-service'));
app.use('/products', createDynamicProxy('product-service'));
app.use('/images', createDynamicProxy('image-service'));
app.use('/search', createDynamicProxy('search-service'));

// Global Error Handler - Placed AFTER all routes and proxies
app.use(errorHandler);

module.exports = app;