export const allowRoles = (roles = []) => (req, res, next) => {
  if (!req.user || !Array.isArray(roles) || roles.length === 0) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};

