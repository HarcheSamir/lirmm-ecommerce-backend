// stats-service/src/modules/stats/stats.routes.js
const express = require('express');
const {
    getKpis,
    getRevenueCogsOverTime,
    getRevenueYoY,
    getRevenueWoW,
    getTopProducts
} = require('./stats.controller');
const adminOnlyMiddleware = require('../../middlewares/adminOnly');

const router = express.Router();

// All stats routes are protected and for admin use only
router.use(adminOnlyMiddleware);

router.get('/kpis', getKpis);
router.get('/revenue-cogs-over-time', getRevenueCogsOverTime);
router.get('/revenue-yoy', getRevenueYoY);
router.get('/revenue-wow', getRevenueWoW);
router.get('/top-products', getTopProducts);

module.exports = router;