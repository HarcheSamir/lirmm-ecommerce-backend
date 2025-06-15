// ===== FILE: auth-service/src/middlewares/permission.js =====

/**
 * Higher-order function to create a middleware that checks for a specific permission.
 * @param {string} requiredPermission - The permission string to check for (e.g., 'create:product').
 * @returns {function} Express middleware function.
 */
const hasPermission = (requiredPermission) => {
    return (req, res, next) => {
      // This middleware assumes the `authMiddleware` has already run and attached `req.user`
      const user = req.user;
  
      if (!user || !Array.isArray(user.permissions)) {
        console.warn(`Permission Denied: User object or permissions array not found on request for user ID: ${user?.id}.`);
        return res.status(403).json({ message: 'Forbidden: Invalid user credentials format.' });
      }
  
      if (user.permissions.includes(requiredPermission)) {
        return next();
      } else {
        console.warn(`Permission Denied: User ID '${user.id}' with role '${user.role}' lacks required permission '${requiredPermission}'.`);
        return res.status(403).json({ message: 'Forbidden: You do not have the required permission to perform this action.' });
      }
    };
  };
  
  module.exports = hasPermission;