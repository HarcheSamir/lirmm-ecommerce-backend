const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// --- Configuration ---
// This map replaces the dynamic Consul lookup. It maps a service name
// to its static URL defined in the docker-compose.yml environment.
const serviceUrlMap = {
    'auth-service': process.env.AUTH_SERVICE_URL,
    'product-service': process.env.PRODUCT_SERVICE_URL,
    'image-service': process.env.IMAGE_SERVICE_URL,
    'search-service': process.env.SEARCH_SERVICE_URL,
    'cart-service': process.env.CART_SERVICE_URL,
    'order-service': process.env.ORDER_SERVICE_URL,
    'review-service': process.env.REVIEW_SERVICE_URL,
};


// --- Middleware & Health Checks ---
app.use(cors());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({ message: `${process.env.SERVICE_NAME || 'API Gateway'} is online.` });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});


// --- Proxy Creation Function (Adapted from your original) ---
// We keep your clean function signature, but change its internal logic.
const createProxy = (serviceName, pathRewriteRule = null) => {
    const target = serviceUrlMap[serviceName];

    // If the service URL is not defined in the environment, we log a warning
    // and return a middleware that sends a 503 Service Unavailable error.
    if (!target) {
        console.warn(`[API Gateway] Target for service '${serviceName}' is not configured in environment variables.`);
        return (req, res, next) => {
            res.status(503).json({ message: `Service '${serviceName}' is not configured or available.` });
        };
    }

    const proxyOptions = {
        target,
        changeOrigin: true,
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        onError: (err, req, res) => { // Using your robust error handler
            console.error(`[API Gateway] Proxy Error for ${serviceName}:`, err.message);
            const statusCode = (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') ? 503 : 502;
            if (!res.headersSent) {
                res.status(statusCode).json({ message: `The '${serviceName}' service is currently unavailable.` });
            }
        },
    };

    // This is the key part: if a special pathRewrite rule is passed
    // (like for the /images service), we use it. Otherwise, http-proxy-middleware's
    // default behavior of stripping the base path is what we want.
    if (pathRewriteRule) {
        proxyOptions.pathRewrite = pathRewriteRule;
    }

    return createProxyMiddleware(proxyOptions);
};


// --- Route Definitions (Your original, clean structure) ---
// This is much more readable and maintainable.
app.use('/auth', createProxy('auth-service'));
app.use('/products', createProxy('product-service'));
app.use('/images', createProxy('image-service', { '^/images': '' }));
app.use('/search', createProxy('search-service'));
app.use('/carts', createProxy('cart-service'));
app.use('/orders', createProxy('order-service'));
app.use('/reviews', createProxy('review-service'));


// --- Final Error Handler ---
app.use((req, res, next) => {
    // This will catch any requests that didn't match a proxy route
    res.status(404).json({ message: 'Not Found' });
});

module.exports = app;