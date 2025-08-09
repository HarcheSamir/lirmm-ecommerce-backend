const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
if (!AUTH_SERVICE_URL) {
    console.error('FATAL: AUTH_SERVICE_URL environment variable is not defined.');
    process.exit(1);
}

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header missing or invalid (Bearer Token)' });
        }
        const token = authHeader.split(' ')[1];

        const validationUrl = `${AUTH_SERVICE_URL}/validate`;
        const response = await axios.post(validationUrl, { token }, { timeout: 5000 });

        if (!response.data || !response.data.valid || !response.data.user) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        req.user = response.data.user;
        next();
    } catch (error) {
        const status = error.response?.status || 503;
        const message = error.response?.data?.message || 'Authentication service unavailable';
        res.status(status).json({ message });
    }
};

module.exports = authMiddleware;