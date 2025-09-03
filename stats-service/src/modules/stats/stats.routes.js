// stats-service/src/modules/stats/stats.routes.js
const express = require('express');
const {
    getKpis,
    getRevenueTimeSeries,
    getTopSellingProducts,
} = require('./stats.controller');

const router = express.Router();

router.get('/kpis', getKpis);
router.get('/revenue/time-series', getRevenueTimeSeries);
router.get('/products/top-selling', getTopSellingProducts);

module.exports = router;