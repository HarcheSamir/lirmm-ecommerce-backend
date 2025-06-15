// ===== FILE: order-service/src/middlewares/adminOnly.js =====
const axios = require('axios');
const { findService } = require('../config/consul');

const adminOnlyMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header is required for this action.' });
        }
        const token = authHeader.split(' ')[1];

        const authServiceUrl = await findService('auth-service');
        if (!authServiceUrl) {
            return res.status(503).json({ message: 'Authentication service is unavailable.' });
        }
        
        const validationUrl = `${authServiceUrl}/validate`;
        const response = await axios.post(validationUrl, { token }, { timeout: 5000 });

        const user = response.data?.user;

        if (user && user.role === 'ADMIN') {
            req.user = user;
            return next();
        }
        
        return res.status(403).json({ message: 'Forbidden: Administrator access required.' });

    } catch (error) {
        const status = error.response?.status || 401;
        const message = error.response?.data?.message || 'Authentication failed.';
        res.status(status).json({ message });
    }
};

module.exports = adminOnlyMiddleware;