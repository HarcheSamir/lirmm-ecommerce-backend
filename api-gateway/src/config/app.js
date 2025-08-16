// api-gateway/src/config/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware'); // Still used for simple routes
const proxy = require('express-http-proxy'); // The new, better proxy for this job
const axios = require('axios');

const app = express();
// NO GLOBAL BODY PARSER.

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

// --- DEDICATED ENRICHMENT MIDDLEWARE WITH LOGS ---
// This middleware remains the same. It populates req.body.
const enrichOrderPayload = async (req, res, next) => {
    try {
        if (req.method !== 'POST' || !req.body || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            return next();
        }

        console.log(`\n\n--- [${new Date().toISOString()}] GATEWAY DIAGNOSTIC RUN ---`);
        console.log('--- DIAGNOSIS (POINT A): ORIGINAL BODY FROM CLIENT ---');
        console.log(JSON.stringify(req.body, null, 2));

        const variantIds = req.body.items.map(item => item.variantId);
        const variantDetailsUrl = `${serviceUrlMap['product-service']}/internal/variant-details`;

        console.log(`--- DIAGNOSIS: Calling Product Service at ${variantDetailsUrl} with Variant IDs:`, variantIds);
        const { data: variantData } = await axios.post(variantDetailsUrl, { variantIds });

        console.log('--- DIAGNOSIS (POINT B): DATA RECEIVED FROM PRODUCT SERVICE ---');
        console.log(JSON.stringify(variantData, null, 2));

        const enrichedItems = req.body.items.map(item => {
            const details = variantData[item.variantId];
            if (!details) {
                throw { status: 400, message: `Product variant with ID ${item.variantId} not found or is invalid.` };
            }
            return { ...item, ...details };
        });

        req.body = { ...req.body, items: enrichedItems };

        console.log('--- DIAGNOSIS (POINT C): ENRICHED BODY TO BE PROXIED ---');
        console.log(JSON.stringify(req.body, null, 2));

        console.log('--- DIAGNOSIS: Enrichment complete. Passing to proxy. ---\n\n');
        next();

    } catch (error) {
        console.error('\n\n--- [API Gateway] FATAL ENRICHMENT ERROR ---', error.message);
        if (!res.headersSent) {
            const status = error.status || 502;
            res.status(status).json({ message: error.message || 'Failed to process order.' });
        }
    }
};


// --- Route Definitions ---
// Use the simple proxy for routes that DON'T need body modification.
const rootPathRewrite = (path) => ({ [`^${path}`]: '' });
app.use('/auth', createProxyMiddleware({ target: serviceUrlMap['auth-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/auth') }));
app.use('/products', createProxyMiddleware({ target: serviceUrlMap['product-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/products') }));
app.use('/images', createProxyMiddleware({ target: serviceUrlMap['image-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/images') }));
app.use('/search', createProxyMiddleware({ target: serviceUrlMap['search-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/search') }));
app.use('/carts', createProxyMiddleware({ target: serviceUrlMap['cart-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/carts') }));
app.use('/reviews', createProxyMiddleware({ target: serviceUrlMap['review-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/reviews') }));
app.use('/payments', createProxyMiddleware({ target: serviceUrlMap['payment-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/payments') }));
app.use('/stats', createProxyMiddleware({ target: serviceUrlMap['stats-service'], changeOrigin: true, pathRewrite: rootPathRewrite('/stats') }));


// --- THE NEW, RELIABLE, AND CORRECT ORDER ROUTE CHAIN ---
// This chain will handle all /orders requests
app.use(
    '/orders',
    // 1. Parse the body FIRST. This is safe with this library.
    express.json(),
    // 2. Run our enrichment middleware which modifies req.body.
    enrichOrderPayload,
    // 3. Use the new proxy middleware.
    proxy(serviceUrlMap['order-service'], {
        // This function is the key. It tells the proxy what the final body should be.
        proxyReqBodyDecorator: function(bodyContent, srcReq) {
            // We simply return the fully-formed, enriched body from our previous middleware.
            // The library handles stringifying it and setting Content-Length correctly.
            return srcReq.body;
        },
        // This ensures that /orders/some/path becomes /some/path for the order-service.
        proxyReqPathResolver: function(req) {
            return req.originalUrl.replace('/orders', '');
        }
    })
);


// --- Final Error Handler ---
app.use((req, res, next) => {
    res.status(404).json({ message: `Not Found: The path '${req.path}' does not exist on the API Gateway.` });
});

module.exports = app;