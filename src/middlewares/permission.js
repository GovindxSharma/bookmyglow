/**
 * Permission middleware — controls CRUD access based on role and resource
 * @param {String} action - One of ['create', 'read', 'update', 'delete']
 * @param {String} resource - Optional: 'user', 'appointment', 'service', etc.
 */
export const checkPermission = (action, resource = "") => {
  return (req, res, next) => {
    const user = req.user; // set by verifyToken
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const role = user.role;
    const userId = user._id?.toString();
    const targetId = req.params.id;

    // 🔐 General permissions by role
    const rolePermissions = {
      super_admin: ["create", "read", "update", "delete"],
      admin: ["create", "read", "update", "delete"],
      receptionist: ["create", "read", "update"],
      employee: ["read"],
    };

    // Step 1: general action check
    if (!rolePermissions[role]?.includes(action)) {
      return res
        .status(403)
        .json({ message: `Forbidden: ${role} cannot perform ${action}` });
    }

    // Step 2: resource-specific rules
    switch (resource) {
      case "user":
        if (action === "update") {
          if (role === "admin" || role === "super_admin" || userId === targetId)
            return next();
          return res
            .status(403)
            .json({ message: "Forbidden: Cannot update this user" });
        }
        if (action === "delete") {
          if (role === "admin" || role === "super_admin") return next();
          return res
            .status(403)
            .json({ message: "Forbidden: Cannot delete this user" });
        }
        break;

      case "appointment":
        if (action === "create") {
          if (role === "admin" || role === "receptionist") return next();
          return res
            .status(403)
            .json({ message: "Forbidden: Cannot create appointment" });
        }

        if (action === "read" || action === "update") {
          if (role === "admin" || role === "receptionist") return next();
          // employee can only access appointments assigned to them
          if (
            role === "employee" &&
            req.body.employee_id?.toString() === userId
          )
            return next();
          return res
            .status(403)
            .json({ message: "Forbidden: Cannot access this appointment" });
        }

        if (action === "delete") {
          if (role === "admin" || role === "super_admin") return next();
          return res
            .status(403)
            .json({ message: "Forbidden: Cannot delete appointment" });
        }
        break;

      case "service":
      case "inventory":
        
      case "attendance":
        if (action === "create" || action === "read" || action === "update") {
          if (["admin", "receptionist"].includes(role)) return next();
        }
        if (action === "delete") {
          if (["admin", "super_admin"].includes(role)) return next();
        }
        return res
          .status(403)
          .json({ message: "Forbidden: Cannot access attendance" });

      
      case "payment":
        // Only admin/super_admin can CRUD
        if (role === "admin" || role === "super_admin") return next();
        return res.status(403).json({ message: "Access denied" });

      default:
        return next();
    }

    // fallback
    next();
  };
};
