const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

app.use(cors());
app.use(morgan('dev'));

// A simple root endpoint for the gateway
app.get('/', (req, res) => {
    res.json({ message: `${process.env.SERVICE_NAME || 'API Gateway'} is online.` });
});

// A standard health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME });
});

module.exports = app;