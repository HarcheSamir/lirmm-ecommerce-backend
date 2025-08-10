const express = require('express');
const { processPayment } = require('./payment.controller');

const router = express.Router();

router.post('/process', processPayment);

module.exports = router;