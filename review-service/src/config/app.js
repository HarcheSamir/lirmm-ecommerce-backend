const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const reviewRoutes = require('../modules/review/review.routes');
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

app.use('/', reviewRoutes);

app.use(errorHandler);

module.exports = { app };