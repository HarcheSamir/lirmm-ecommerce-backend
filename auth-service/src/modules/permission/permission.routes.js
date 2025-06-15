// ===== FILE: auth-service/src/modules/permission/permission.routes.js =====

const express = require('express');
const { getAllPermissions } = require('./permission.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// This endpoint is used by admins to see what permissions are available to assign to roles.
router.get('/', authMiddleware, hasPermission('read:roles'), getAllPermissions);

module.exports = router;