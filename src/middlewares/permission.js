/**
 * Check permissions for a route
 * @param {String} action - 'update' | 'delete'
 */
export const checkPermission = (action) => {
  return (req, res, next) => {
    const userRole = req.user.role; // role from verifyToken
    const userId = req.user._id.toString(); // logged-in user ID
    const targetId = req.params.id; // target user ID

    switch (action) {
      case "update":
        // Admin can update anyone, customer can update only self
        if (userRole === "admin" || userId === targetId) {
          return next();
        }
        return res
          .status(403)
          .json({ message: "Forbidden: Cannot update this user" });

      case "delete":
        // Only super_admin or admin can delete
        if (userRole === "super_admin" || userRole === "admin") {
          return next();
        }
        return res
          .status(403)
          .json({ message: "Forbidden: Cannot delete this user" });

      default:
        return res.status(403).json({ message: "Forbidden: Invalid action" });
    }
  };
};
