// ===== FILE: auth-service/src/modules/permission/permission.routes.js =====

const express = require('express');
const { getAllPermissions } = require('./permission.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// --- FIX: Use singular permission name ---
router.get('/', authMiddleware, hasPermission('read:role'), getAllPermissions);

module.exports = router;