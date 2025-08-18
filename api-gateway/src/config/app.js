// api-gateway/src/config/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const proxy = require('express-http-proxy');
const axios = require('axios');
const http = require('http'); 
const app = express();

// --- Configuration ---
const serviceUrlMap = {
    'auth-service': process.env.AUTH_SERVICE_URL,
    'product-service': process.env.PRODUCT_SERVICE_URL,
    'image-service': process.env.IMAGE_SERVICE_URL,
    'search-service': process.env.SEARCH_SERVICE_URL,
    'cart-service': process.env.CART_SERVICE_URL,
    'order-service': process.env.ORDER_SERVICE_URL,
    'review-service': process.env.REVIEW_SERVICE_URL,
    'payment-service': process.env.PAYMENT_SERVICE_URL,
    'stats-service': process.env.STATS_SERVICE_URL,
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

// --- DEDICATED ENRICHMENT MIDDLEWARE (FOR POST ONLY) ---
const enrichOrderPayload = async (req, res, next) => {
    try {
        const variantIds = req.body.items.map(item => item.variantId);
        const variantDetailsUrl = `${serviceUrlMap['product-service']}/internal/variant-details`;
        const { data: variantData } = await axios.post(variantDetailsUrl, { variantIds });
        const enrichedItems = req.body.items.map(item => {
            const details = variantData[item.variantId];
            if (!details) {
                throw { status: 400, message: `Product variant with ID ${item.variantId} not found or is invalid.` };
            }
            return { ...item, ...details };
        });
        req.body = { ...req.body, items: enrichedItems };
        next();
    } catch (error) {
        console.error('\n\n--- [API Gateway] FATAL ENRICHMENT ERROR ---', error.message);
        if (!res.headersSent) {
            const status = error.status || 502;
            res.status(status).json({ message: error.message || 'Failed to process order.' });
        }
    }
};

// --- Route Definitions for simple proxies (proven to work) ---
const rootPathRewrite = (path) => ({ [`^${path}`]: '' });
app.use('/auth', createProxyMiddleware({ target: serviceUrlMap['auth-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/auth') }));
app.use('/products', createProxyMiddleware({ target: serviceUrlMap['product-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/products') }));
app.use('/images', createProxyMiddleware({ target: serviceUrlMap['image-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/images') }));
app.use('/search', createProxyMiddleware({ target: serviceUrlMap['search-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/search') }));
app.use('/carts', createProxyMiddleware({ target: serviceUrlMap['cart-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/carts') }));
app.use('/reviews', createProxyMiddleware({ target: serviceUrlMap['review-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/reviews') }));
app.use('/payments', createProxyMiddleware({ target: serviceUrlMap['payment-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/payments') }));
app.use('/stats', createProxyMiddleware({ target: serviceUrlMap['stats-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/stats') }));



app.post(
    '/orders',
    express.json(),
    enrichOrderPayload,
    proxy(serviceUrlMap['order-service'], {
        proxyReqPathResolver: (req) => {
            // Proxies POST /orders to POST / on the order-service
            return '/';
        },
        proxyReqBodyDecorator: (bodyContent, srcReq) => srcReq.body
    })
);


app.use(
    '/orders',
    createProxyMiddleware({
        target: serviceUrlMap['order-service'],
        changeOrigin: true,
        pathRewrite: {
            '^/orders': '', // This correctly rewrites /orders/123 to /123
        },
    })
);


// --- Final Error Handler ---
app.use((req, res, next) => {
    res.status(404).json({ message: `Not Found: The path '${req.path}' does not exist on the API Gateway.` });
});

module.exports = app;