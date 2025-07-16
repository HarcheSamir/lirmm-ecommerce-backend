const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const errorHandler = require('../middlewares/errorHandler');
const { findService } = require('./consul');

const app = express();

const IS_IN_KUBERNETES = !!process.env.KUBERNETES_SERVICE_HOST;

const KUBERNETES_SERVICE_URLS = {
    'auth-service': 'http://auth-service-svc:3001',
    'product-service': 'http://product-service-svc:3003',
    'image-service': 'http://image-service-svc:3004',
    'search-service': 'http://search-service-svc:3005',
    'cart-service': 'http://cart-service-svc:3006',
    'order-service': 'http://order-service-svc:3007',
    'review-service': 'http://review-service-svc:3008',
};

app.use(cors());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({ message: `${process.env.SERVICE_NAME || 'API Gateway'} online (K8s mode: ${IS_IN_KUBERNETES})` });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});

const createProxy = (serviceName, pathRewriteRules = null) => {
    return createProxyMiddleware({
        router: async (req) => {
            if (IS_IN_KUBERNETES) {
                console.log(`[K8s Proxy] Routing to static URL for ${serviceName}`);
                return KUBERNETES_SERVICE_URLS[serviceName];
            } else {
                console.log(`[Consul Proxy] Discovering and routing to ${serviceName}`);
                const targetUrl = await findService(serviceName);
                if (!targetUrl) {
                    throw new Error(`Service '${serviceName}' not found in Consul.`);
                }
                return targetUrl;
            }
        },
        changeOrigin: true,
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        pathRewrite: pathRewriteRules,
        onError: (err, req, res, next) => {
            console.error(`[API Gateway] Proxy Error to ${serviceName}:`, err.message);
            if (!res.headersSent) {
                res.status(503).json({ message: `Service '${serviceName}' is unavailable.` });
            } else {
                next(err);
            }
        },
    });
};

app.use('/auth', createProxy('auth-service'));
app.use('/products', createProxy('product-service'));
app.use('/images', createProxy('image-service', { '^/images': '' }));
app.use('/search', createProxy('search-service'));
app.use('/carts', createProxy('cart-service'));
app.use('/orders', createProxy('order-service'));
app.use('/reviews', createProxy('review-service'));

app.use(errorHandler);

module.exports = app;