// Same basic error handler as other services
const errorHandler = (err, req, res, next) => {
    console.error(err); // Use a structured logger in production
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        // Optionally include stack trace in development
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;