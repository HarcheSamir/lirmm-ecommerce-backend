// ===== FILE: order-service/src/config/app.js =====
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const orderRoutes = require('../modules/order/order.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});

app.use('/', orderRoutes); // Mount at root, API Gateway will handle /orders prefix

app.use(errorHandler);

// Index.js will start the server
const startApp = async () => {
    // any async startup logic can go here
};

module.exports = { app, startApp };