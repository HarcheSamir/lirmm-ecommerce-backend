// ===== FILE: order-service/src/middlewares/optionalAuth.js =====
const axios = require('axios');
const { findService } = require('../config/consul');

const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, proceed as guest.
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        // Header exists but no token, proceed as guest.
        return next();
    }

    try {
        const authServiceUrl = await findService('auth-service');
        if (!authServiceUrl) {
            console.error('OptionalAuth: Auth service is unavailable. Treating user as guest.');
            return next();
        }

        const validationUrl = `${authServiceUrl}/validate`;
        const response = await axios.post(validationUrl, { token }, { timeout: 5000 });

        if (response.data && response.data.valid && response.data.user) {
            // Token is valid, attach user data.
            req.user = response.data.user;
        }
        
        // If token is valid but response structure is wrong, or if token is invalid
        // and auth-service returns a 2xx status (which it shouldn't, but for safety),
        // the user will simply not have req.user set, and will proceed as a guest.
        return next();

    } catch (error) {
        // *** CRITICAL FIX: IF TOKEN VALIDATION FAILS, PROCEED AS GUEST ***
        // Log the error for debugging but DO NOT block the request.
        // This handles cases where the auth-service returns 401 for an invalid token.
        console.warn(`OptionalAuth: A provided token was invalid, but proceeding as guest. Error: ${error.message}`);
        return next(); 
    }
};

module.exports = optionalAuthMiddleware;