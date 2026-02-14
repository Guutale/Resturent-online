export const deliveryMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "delivery") {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};

