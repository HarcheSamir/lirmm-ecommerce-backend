// ===== FILE: order-service/src/middlewares/optionalAuth.js =====
const axios = require('axios');
const { findService } = require('../config/consul');

const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // If no auth header is present, this is a guest. Proceed.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        // Header exists but no token, treat as guest.
        return next();
    }

    try {
        const authServiceUrl = await findService('auth-service');
        if (!authServiceUrl) {
            // If auth service is down, we can't validate tokens, but we shouldn't block guests.
            // Log the error and proceed as if the user is a guest.
            console.error('OptionalAuth: Auth service is unavailable. Treating user as guest.');
            return next();
        }

        const validationUrl = `${authServiceUrl}/validate`;
        const response = await axios.post(validationUrl, { token }, { timeout: 5000 });

        // If token is valid, attach user data to the request.
        if (response.data && response.data.valid && response.data.user) {
            req.user = response.data.user;
        }
        // If token is invalid, the auth service will have returned a non-2xx status,
        // which throws an error caught below. We treat this as a hard failure.

        return next();
    } catch (error) {
        // A provided token that is INVALID is a hard error. We don't want to let them proceed as a guest.
        // This prevents confusion and potential security issues.
        const status = error.response?.status || 401;
        const message = error.response?.data?.message || 'The provided authentication token is invalid or expired.';
        return res.status(status).json({ message });
    }
};

module.exports = optionalAuthMiddleware;