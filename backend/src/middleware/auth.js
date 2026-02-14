import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role isBlocked").lean();

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    req.user = { id: String(user._id), role: user.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
