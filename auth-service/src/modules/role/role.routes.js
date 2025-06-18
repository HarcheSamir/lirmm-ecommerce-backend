// ===== FILE: auth-service/src/modules/role/role.routes.js =====

const express = require('express');
const { getAllRoles, getRoleById, createRole, updateRole, deleteRole } = require('./role.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();
router.use(authMiddleware);

// --- FIX: Use singular permission names ---
router.get('/', hasPermission('read:role'), getAllRoles);
router.post('/', hasPermission('write:role'), createRole);
router.get('/:id', hasPermission('read:role'), getRoleById);
router.put('/:id', hasPermission('write:role'), updateRole);
router.delete('/:id', hasPermission('write:role'), deleteRole);

module.exports = router;