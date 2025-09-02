const express = require('express');
const { getRates, getRateByCode, upsertRate } = require('./currency.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// --- Public / Internal Routes ---
router.get('/', getRates);
router.get('/internal/rates/:code', getRateByCode);

// --- Admin Routes ---
router.post('/', authMiddleware, hasPermission('write:currency'), upsertRate);

module.exports = router;