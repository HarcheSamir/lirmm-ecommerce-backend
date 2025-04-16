const errorHandler = (err, req, res, next) => {
    console.error(err); // In production, use a logger instead of console.error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: err.message || 'Internal Server Error',
    });
  };
  
  module.exports = errorHandler;