// stats-service/src/middlewares/adminOnly.js
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
if (!AUTH_SERVICE_URL) {
    console.error('FATAL: AUTH_SERVICE_URL environment variable is not defined.');
    process.exit(1);
}

const adminOnlyMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header is required for this action.' });
        }
        const token = authHeader.split(' ')[1];

        const validationUrl = `${AUTH_SERVICE_URL}/validate`;
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