// src/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error(`[${process.env.SERVICE_NAME || 'Service'} Error Handler] Status: ${err.statusCode || 500} | Message: ${err.message}`);
    if (process.env.NODE_ENV === 'development' || !err.statusCode || err.statusCode >= 500) {
        console.error(err.stack);
    }

    // Determine status code
    const statusCode = err.statusCode || 500;
    let message = err.message || 'An internal server error occurred.';


    if (res.headersSent) {
        console.error("Headers already sent, cannot send error response to client.");
        return next(err);
    }

    res.status(statusCode).json({
        status: 'error',
        message: message,

    });
};

module.exports = errorHandler;
