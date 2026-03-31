const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "admin" && !decoded.id) {
      req.user = {
        id: null,
        name: "Admin",
        email: decoded.email || "",
        role: "admin",
        membershipStatus: "approved",
      };
      return next();
    }

    const user = await User.findById(decoded.id).select("name email role membershipStatus");
    if (!user) {
      return res.status(401).json({ success: false, message: "Authenticated user not found" });
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus,
    };

    next();
  } catch (error) {
    console.error("[auth.middleware] Token verification failed", {
      message: error.message,
    });
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

const requireMember = (req, res, next) => {
  if (req.user?.role !== "member") {
    return res.status(403).json({ success: false, message: "Member access required" });
  }
  next();
};

module.exports = { auth, requireAdmin, requireMember };
