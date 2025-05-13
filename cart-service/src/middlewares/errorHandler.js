// src/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // Log the error (replace with a proper logger in production)
    console.error(`[${process.env.SERVICE_NAME || 'Service'} Error Handler] Status: ${err.statusCode || 500} | Message: ${err.message}`);
    if (process.env.NODE_ENV === 'development' || !err.statusCode || err.statusCode >= 500) {
        // Log stack trace for development or for server errors in production
        console.error(err.stack);
    }

    // Determine status code
    const statusCode = err.statusCode || 500;
    let message = err.message || 'An internal server error occurred.';

    // Customize messages for known error types or codes if needed
    // Example: if (err.code === 'REDIS_CONN_ERROR') message = 'Cart service temporarily unavailable.';

    // Ensure headers are not already sent
    if (res.headersSent) {
        console.error("Headers already sent, cannot send error response to client.");
        return next(err);
    }

    res.status(statusCode).json({
        status: 'error',
        message: message,
        // Optionally, provide an error code for client-side handling
        // code: err.errorCode || (statusCode === 500 ? 'INTERNAL_ERROR' : 'GENERAL_ERROR'),
    });
};

module.exports = errorHandler;
