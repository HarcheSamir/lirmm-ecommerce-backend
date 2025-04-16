const express = require('express');
const { getUserById } = require('./user.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

// Protected route: get user profile by ID
router.get('/:id', authMiddleware, getUserById);

module.exports = router;