const axios = require('axios');
const AUTH_SERVICE_URL = 'http://auth-service-svc.lirmm-services.svc.cluster.local:3001';

const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return next();
    }

    try {
        const validationUrl = `${AUTH_SERVICE_URL}/validate`;
        const response = await axios.post(validationUrl, { token }, { timeout: 5000 });

        if (response.data && response.data.valid && response.data.user) {
            req.user = response.data.user;
        }
        return next();
    } catch (error) {
        console.warn(`OptionalAuth: A provided token was invalid, proceeding as guest. Error: ${error.message}`);
        return next();
    }
};

module.exports = optionalAuthMiddleware;