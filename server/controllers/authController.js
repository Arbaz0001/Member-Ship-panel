const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Member = require("../models/Member");
const { getMembershipPlan, getNextMemberId } = require("../utils/membershipRegistration");

const buildToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const sanitizeAuthBody = (body) => ({
  fullName: body?.fullName || "",
  fatherName: body?.fatherName || "",
  mobile: body?.mobile || "",
  email: body?.email?.toLowerCase() || "",
  address: body?.address || "",
  occupation: body?.occupation || "",
  annualIncome: body?.annualIncome || "",
  membershipType: body?.membershipType || "",
  membershipPriceId: body?.membershipPriceId || "",
});

const buildAuthUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});

const registerUser = async (req, res, next) => {
  let createdUser = null;
  let createdMember = null;

  try {
    console.log("[auth.register] Incoming registration request", sanitizeAuthBody(req.body));

    const {
      fullName,
      fatherName,
      mobile,
      email,
      address,
      occupation,
      annualIncome,
      membershipType,
      membershipPriceId,
      password,
    } = req.body;

    if (
      !fullName ||
      !fatherName ||
      !mobile ||
      !email ||
      !address ||
      !occupation ||
      !annualIncome ||
      !membershipType ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const memberId = await getNextMemberId();
    const selectedPlan = await getMembershipPlan({ membershipType, membershipPriceId });

    createdUser = await User.create({
      name: fullName,
      email: email.toLowerCase(),
      phone: mobile,
      password,
      address,
      membershipType: selectedPlan.normalizedType,
      membershipStatus: "pending",
      role: "member",
    });

    createdMember = await Member.create({
      memberId,
      fullName,
      fatherName,
      mobile,
      email: email.toLowerCase(),
      address,
      occupation,
      annualIncome: Number(annualIncome),
      membershipType: selectedPlan.normalizedType,
      membershipPlanId: selectedPlan.planId,
      membershipPlanName: selectedPlan.planName,
      membershipFee: selectedPlan.fee,
      profileImage: req.file ? `/uploads/profiles/${req.file.filename}` : undefined,
      status: "pending",
    });

    const token = buildToken(createdUser);
    console.log("[auth.register] Registration completed", {
      userId: String(createdUser._id),
      memberId: createdMember.memberId,
      tokenIssued: Boolean(token),
    });

    return res.status(201).json({
      success: true,
      message: "Membership registration completed successfully",
      token,
      user: buildAuthUser(createdUser),
      member: createdMember,
    });
  } catch (err) {
    if (createdMember?._id) {
      await Member.findByIdAndDelete(createdMember._id).catch(() => null);
    }
    if (createdUser?._id) {
      await User.findByIdAndDelete(createdUser._id).catch(() => null);
    }
    next(err);
  }
};

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
      user: buildAuthUser(user),
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
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser, getCurrentUser };
