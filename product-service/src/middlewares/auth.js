// ===== FILE: product-service/src/middlewares/auth.js =====

const axios = require('axios');
const { findService } = require('../config/consul'); // Import discovery helper

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header missing or invalid format (Bearer Token)' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token missing' });
        }

        // 1. Discover Auth Service URL
        const authServiceUrl = await findService('auth-service'); // CORRECT: The result is the full URL string.
        if (!authServiceUrl) {
            console.error('Auth Middleware: Could not discover auth-service via Consul.');
            return res.status(503).json({ message: 'Authentication service is currently unavailable.' });
        }

        // 2. Validate token with discovered Auth service instance
        // CORRECT: Construct the validation URL by appending the path to the base URL string.
        const validationUrl = `${authServiceUrl}/validate`;
        console.log(`Auth Middleware: Validating token via ${validationUrl}`); // This log will now show the correct URL.

        const response = await axios.post(validationUrl, { token }, {
            timeout: 5000 // Add a reasonable timeout
        });

        // Check structure of auth-service response (adjust if necessary)
        if (!response.data || !response.data.valid || !response.data.user) {
            console.warn('Auth Middleware: Token validation failed by auth-service or response structure invalid.', response.data);
            return res.status(401).json({ message: response.data?.message || 'Invalid or expired token' });
        }

        // 3. Attach user data to the request object
        req.user = response.data.user; // Contains user ID, roles, permissions etc.
        console.log(`Auth Middleware: Token validated successfully for user ID: ${req.user.id}`);
        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        if (error.response) {
            // Auth service returned an error (e.g., 401, 500)
            console.error(`Auth Middleware: Auth service responded with error ${error.response.status}:`, error.response.data);
            return res.status(error.response.status || 401).json({ message: error.response.data?.message || 'Authentication failed' });
        } else if (error.request || (error.code && ['ECONNREFUSED', 'ERR_INVALID_URL'].includes(error.code))) {
            // Network error communicating with auth service (service down, DNS issue, timeout, or invalid URL from failed discovery)
            console.error('Auth Middleware: Network or URL error contacting auth service:', error.message);
            return res.status(503).json({ message: 'Authentication service unavailable (network/URL error).' });
        } else if (error.message.includes('Consul discovery failed')) {
             // Specific error from our findService helper
             console.error('Auth Middleware: Consul discovery failed:', error.message);
             return res.status(503).json({ message: 'Authentication service unavailable (discovery failure).' });
        } else {
            // Other unexpected errors (e.g., code errors within this middleware)
            console.error('Auth Middleware: Unexpected error:', error);
            return res.status(500).json({ message: 'An internal error occurred during authentication.' });
        }
    }
};

module.exports = authMiddleware;