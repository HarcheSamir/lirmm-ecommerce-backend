// product-service/src/middlewares/errorHandler.js
// REMOVED Prisma import as instanceof is not used

const errorHandler = (err, req, res, next) => {
  // Log the error minimally in test, more verbosely otherwise
  if (process.env.NODE_ENV !== 'test') {
      console.error("Error Handled:", err);
  } else {
      // In test, just log the fact an error reached the handler, unless it's unexpected
      if (!err.code && (!err.statusCode || err.statusCode >= 500) ) {
           console.error("Unexpected Test Error:", err);
      }
  }


  // Prioritize explicitly set statusCode on the error object
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Check for specific Prisma Error Codes ONLY if statusCode wasn't already set to something specific (like 404/400 by a controller)
  if (err.code && statusCode === 500) { // Only check codes if status is still default 500
      switch (err.code) {
          case 'P2002': // Unique constraint failed
              statusCode = 409; // Conflict
              message = `Unique constraint violation: ${err.meta?.target?.join(', ') || 'details unavailable'}`;
              break;
          case 'P2003': // Foreign key constraint failed
               statusCode = 400; // Bad Request
               message = `Foreign key constraint failed: ${err.meta?.field_name || 'details unavailable'}`;
               break;
          // case 'P2014': // Often related to FK constraints
          //      statusCode = 400;
          //      message = `Relation constraint violation.`;
          //      break;
          case 'P2025': // Record to update/delete not found
              statusCode = 404; // Not Found
              message = err.meta?.cause || 'Record not found.';
              break;
          // Add other Prisma codes if needed
          default:
              // If it looks like a Prisma code but isn't handled, keep 500
              if (/^P\d+$/.test(err.code)) {
                   statusCode = 500;
                   message = `Unhandled Database Error Code: ${err.code}`;
              }
              // Otherwise, let the initial statusCode/message stand (e.g., if err.statusCode was already set)
              break;
      }
  }
  // Add checks for other custom error types if necessary

  // Ensure headers are not already sent
   if (res.headersSent) {
      console.error("Headers already sent, cannot send error response.");
      // Node's default behavior on double sending is okay here, or we can destroy socket
      return next(err); // Let Express handle final cleanup
   }

  res.status(statusCode).json({
    message: message,
  });
};

module.exports = errorHandler;