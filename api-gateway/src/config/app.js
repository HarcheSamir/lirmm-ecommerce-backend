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
app.use(morgan('dev')); // Consistent with other services, can be 'combined' for prod

// Root Route
app.get('/', (req, res) => {
    res.json({ message: `${process.env.SERVICE_NAME || 'API Gateway'} online` });
});


app.get('/health', (req, res) => {
    // Basic health check for the gateway itself.
    // More advanced checks could ping Consul or other critical infrastructure.
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});

// Create proxy configuration dynamically
const createDynamicProxy = (serviceName, pathRewriteRules = null) => {
    return createProxyMiddleware({
        router: async (req) => {
            const targetUrl = await findService(serviceName);
            if (!targetUrl) {
                 const serviceUnavailableError = new Error(`Service '${serviceName}' unavailable.`);
                 serviceUnavailableError.statusCode = 503;
                 throw serviceUnavailableError; // Caught by onError or global error handler
            }
            // console.log(`[API Gateway] Routing to ${serviceName} at ${targetUrl} for path ${req.path}`);
            return targetUrl;
        },
        changeOrigin: true,
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        pathRewrite: pathRewriteRules, // Apply path rewriting if provided
        onError: (err, req, res, next) => {
             console.error(`[API Gateway] Proxy/Router Error for ${serviceName} to path ${req.originalUrl}:`, err.message);
             const proxyError = new Error();
             proxyError.message = err.message || `Error connecting to service '${serviceName}'.`;
             if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.message.includes("socket hang up")) {
                 proxyError.statusCode = 503; // Service Unavailable
                 proxyError.message = `Service '${serviceName}' is unreachable or unresponsive.`;
             } else if (err.statusCode) {
                proxyError.statusCode = err.statusCode; // Use status code from error if present
             } else {
                 proxyError.statusCode = 502; // Bad Gateway for other proxy errors
             }
             // Prepend context to message
             proxyError.message = `Proxy Error for ${serviceName}: ${proxyError.message}`;

             // If headersSent, Express default error handler will take over.
             // Otherwise, pass to our global error handler.
             if (res.headersSent) {
                console.warn(`[API Gateway] Headers already sent for error to ${serviceName}. Letting Express handle.`);
                return next(err); // Pass original error
             }
             next(proxyError); // Pass our constructed error
        }
    });
};


// Setup dynamic proxies (These come AFTER the /health route)
// The path used here (e.g., '/auth') is what clients call.
// The backend services should listen on their root or simple paths.
// Example: GET /auth/login -> proxied to auth-service at its_url/login
app.use('/auth', createDynamicProxy('auth-service'));
app.use('/products', createDynamicProxy('product-service'));
app.use('/images', createDynamicProxy('image-service', { '^/images': '' })); // Rewrites /images/xyz to /xyz for image-service
app.use('/search', createDynamicProxy('search-service'));
app.use('/carts', createDynamicProxy('cart-service')); // <-- ADDED FOR CART SERVICE

// Global Error Handler - Placed AFTER all routes and proxies
app.use(errorHandler);

module.exports = app;
