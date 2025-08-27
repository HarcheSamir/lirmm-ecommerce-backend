// payment-service/src/modules/payment/payment.routes.js
const express = require('express');
const { processPayment, processRefund } = require('./payment.controller');

const router = express.Router();

router.post('/process', processPayment);
router.post('/refund', processRefund);

module.exports = router;