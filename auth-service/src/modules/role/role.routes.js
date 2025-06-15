// ===== FILE: auth-service/src/modules/role/role.routes.js =====

const express = require('express');
const {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
} = require('./role.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// All role management requires authentication
router.use(authMiddleware);

router.get('/', hasPermission('read:roles'), getAllRoles);
router.post('/', hasPermission('write:roles'), createRole);

router.get('/:id', hasPermission('read:roles'), getRoleById);
router.put('/:id', hasPermission('write:roles'), updateRole);
router.delete('/:id', hasPermission('write:roles'), deleteRole);

module.exports = router;