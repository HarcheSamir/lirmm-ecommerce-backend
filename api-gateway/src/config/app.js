const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { findService } = require('./consul');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({ message: `${process.env.SERVICE_NAME || 'API Gateway'} onlinee` });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});

const createDynamicProxy = (serviceName, pathRewriteRules = null) => {
    return createProxyMiddleware({
        router: async (req) => {
            const targetUrl = await findService(serviceName);
            if (!targetUrl) {
                 const serviceUnavailableError = new Error(`Service '${serviceName}' unavailable.`);
                 serviceUnavailableError.statusCode = 503;
                 throw serviceUnavailableError;
            }
            return targetUrl;
        },
        changeOrigin: true,
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        pathRewrite: pathRewriteRules,
        onError: (err, req, res, next) => {
             console.error(`[API Gateway] Proxy/Router Error for ${serviceName} to path ${req.originalUrl}:`, err.message);
             const proxyError = new Error();
             proxyError.message = err.message || `Error connecting to service '${serviceName}'.`;
             if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.message.includes("socket hang up")) {
                 proxyError.statusCode = 503;
                 proxyError.message = `Service '${serviceName}' is unreachable or unresponsive.`;
             } else if (err.statusCode) {
                proxyError.statusCode = err.statusCode;
             } else {
                 proxyError.statusCode = 502;
             }
             proxyError.message = `Proxy Error for ${serviceName}: ${proxyError.message}`;

             if (res.headersSent) {
                console.warn(`[API Gateway] Headers already sent for error to ${serviceName}. Letting Express handle.`);
                return next(err);
             }
             next(proxyError);
        }
    });
};

app.use('/auth', createDynamicProxy('auth-service'));
app.use('/products', createDynamicProxy('product-service'));
app.use('/images', createDynamicProxy('image-service', { '^/images': '' }));
app.use('/search', createDynamicProxy('search-service'));
app.use('/carts', createDynamicProxy('cart-service'));
app.use('/orders', createDynamicProxy('order-service'));
app.use('/reviews', createDynamicProxy('review-service'));

app.use(errorHandler);

module.exports = app;