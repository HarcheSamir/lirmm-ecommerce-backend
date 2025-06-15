// ===== FILE: order-service/src/middlewares/permission.js =====
const hasPermission = (requiredPermission) => {
    return (req, res, next) => {
      const user = req.user;
      if (!user || !Array.isArray(user.permissions)) {
        return res.status(403).json({ message: 'Forbidden: Invalid credentials format.' });
      }
      if (user.permissions.includes(requiredPermission)) {
        return next();
      } else {
        return res.status(403).json({ message: 'Forbidden: You do not have the required permission.' });
      }
    };
  };
  module.exports = hasPermission;