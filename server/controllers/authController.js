const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const buildToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("[auth.login] Incoming login request", {
      email: email?.toLowerCase() || "",
    });

    const user = await User.findOne({ email: email?.toLowerCase() });
    console.log("[auth.login] User lookup result", {
      email: email?.toLowerCase() || "",
      found: Boolean(user),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    console.log("[auth.login] Password comparison result", {
      email: user.email,
      matched: ok,
    });

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = buildToken(user);
    console.log("[auth.login] JWT generated", {
      userId: String(user._id),
      role: user.role,
      tokenIssued: Boolean(token),
    });

    res.json({
      success: true,
      token,
      role: user.role,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role memberId"
    );
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { loginUser, getCurrentUser };
