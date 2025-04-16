// Basic global error handler middleware

const errorHandler = (err, req, res, next) => {
    // Log the error internally (replace with a proper logger in production)
    console.error(`[Error Handler] Status: ${err.statusCode || 500} | Message: ${err.message}`);
    // Log stack trace only in development for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Determine status code, default to 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;

    // Send a generic error response to the client
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'An internal server error occurred',
        // Optionally include error code or type if available and safe
        // code: err.code
    });
};

module.exports = errorHandler;