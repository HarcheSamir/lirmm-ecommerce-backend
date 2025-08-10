const express = require('express');
const { syncHistoricalData } = require('./internal.controller');

const router = express.Router();

router.post('/sync-historical-data', syncHistoricalData);

module.exports = router;