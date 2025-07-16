const axios = require('axios');
const { findService } = require('../config/consul');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header missing or invalid' });
        }
        const token = authHeader.split(' ')[1];

        const authServiceUrl = await findService('auth-service');
        if (!authServiceUrl) {
            return res.status(503).json({ message: 'Authentication service is unavailable.' });
        }

        const validationUrl = `${authServiceUrl}/validate`;
        const response = await axios.post(validationUrl, { token }, { timeout: 5000 });

        if (!response.data || !response.data.valid || !response.data.user) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        req.user = response.data.user;
        next();
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Authentication failed';
        res.status(status).json({ message });
    }
};

module.exports = authMiddleware;