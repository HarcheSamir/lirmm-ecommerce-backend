const express = require('express');
const { 
    register, 
    login, 
    me, 
    validateToken,
    resyncAllUsers,
} = require('./auth.controller');
const authMiddleware = require('../../middlewares/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/validate', validateToken);

router.post('/resync-users', resyncAllUsers);

module.exports = router;