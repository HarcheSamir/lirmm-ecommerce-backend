// ===== FILE: auth-service/src/modules/user/user.routes.js =====

const express = require('express');
const { getAllUsers, getUserById, updateUser, deactivateUser, activateUser } = require('./user.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();
router.use(authMiddleware);

// --- FIX: Use singular permission names ---
router.get('/', hasPermission('read:user'), getAllUsers);
router.get('/:id', hasPermission('read:user'), getUserById);
router.put('/:id', hasPermission('write:user'), updateUser);
router.delete('/:id', hasPermission('delete:user'), deactivateUser);
router.post('/:id/activate', hasPermission('write:user'), activateUser);

module.exports = router;