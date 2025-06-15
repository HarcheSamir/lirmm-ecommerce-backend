// ===== FILE: product-service/src/middlewares/permission.js =====

/**
 * Higher-order function to create a middleware that checks for a specific permission.
 * @param {string} requiredPermission - The permission string to check for (e.g., 'create:product').
 * @returns {function} Express middleware function.
 */
const hasPermission = (requiredPermission) => {
    return (req, res, next) => {
      // This middleware assumes the `authMiddleware` has already run and attached `req.user`
      const user = req.user;
  
      // 1. Check if user object and permissions array exist
      if (!user || !Array.isArray(user.permissions)) {
        console.warn(`Permission Denied: User object or permissions array not found on request for user ID: ${user?.id}. This indicates an issue with the JWT or authMiddleware.`);
        return res.status(403).json({ message: 'Forbidden: Invalid user credentials format.' });
      }
  
      // 2. Check if the user's permissions include the required one
      if (user.permissions.includes(requiredPermission)) {
        // User has the permission, proceed to the next handler
        return next();
      } else {
        // User does not have the permission
        console.warn(`Permission Denied: User ID '${user.id}' with role '${user.role}' lacks required permission '${requiredPermission}'.`);
        return res.status(403).json({ message: 'Forbidden: You do not have the required permission to perform this action.' });
      }
    };
  };
  
  module.exports = hasPermission;