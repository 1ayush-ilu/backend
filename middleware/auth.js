import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function auth(requiredRole = null) {
  return async (req, res, next) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!token) return res.status(401).json({ msg: "No token" });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) return res.status(401).json({ msg: "Invalid user" });
      if (requiredRole && req.user.role !== requiredRole)
        return res.status(403).json({ msg: "Forbidden" });
      next();
    } catch (e) {
      res.status(401).json({ msg: "Unauthorized" });
    }
  };
}
