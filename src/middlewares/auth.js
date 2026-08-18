import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getSecret = () => process.env.JWT_SECRET || "bookmyglow_default_jwt_secret_salon_platform_2026";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No authentication token provided" });
  }

  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : authHeader;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User account no longer exists" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired session token", error: err.message });
  }
};
