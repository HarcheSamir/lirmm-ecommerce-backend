const express = require('express');
const {
    getKpis,
    getRevenueOverTime,
    getTopProducts,
    getRevenueByCountry,
    getProjectionsVsActuals,
    getSalesByPaymentMethod,
} = require('./stats.controller');

const router = express.Router();

router.get('/kpis', getKpis);
router.get('/revenue-over-time', getRevenueOverTime);
router.get('/top-products', getTopProducts);
router.get('/revenue-by-country', getRevenueByCountry);
router.get('/projections-vs-actuals', getProjectionsVsActuals);
router.get('/sales-by-payment-method', getSalesByPaymentMethod);

module.exports = router;