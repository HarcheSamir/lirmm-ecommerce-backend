// ===== FILE: auth-service/src/modules/user/user.routes.js =====

const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
} = require('./user.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// --- Define Routes with Permissions ---

// GET /users - List all users
router.get('/', hasPermission('read:users'), getAllUsers);

// GET /users/:id - Get a single user by ID
router.get('/:id', hasPermission('read:users'), getUserById);

// PUT /users/:id - Update user's name or role
router.put('/:id', hasPermission('write:users'), updateUser);

// DELETE /users/:id - Deactivate a user (soft delete)
router.delete('/:id', hasPermission('delete:users'), deactivateUser);

// POST /users/:id/activate - Re-activate a user
router.post('/:id/activate', hasPermission('write:users'), activateUser);

module.exports = router;