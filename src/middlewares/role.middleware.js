
export const restrictTo = (...roles) => {
  return (req, res, next) => {
 
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }


    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        allowed_roles: roles,
      });
    }

    next();
  };
};

export const isPrincipal = restrictTo("principal");

export const isTeacher = restrictTo("teacher");

export const isAuthenticated = restrictTo("principal", "teacher");
