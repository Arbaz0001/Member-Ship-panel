const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const MembershipPrice = require("../models/MembershipPrice");
const AdminSettings = require("../models/AdminSettings");
const User = require("../models/User");
const Counter = require("../models/Counter");

let membershipPriceIndexChecked = false;

const ensureMembershipPriceIndexes = async (force = false) => {
  if (membershipPriceIndexChecked && !force) return;
  try {
    const indexes = await MembershipPrice.collection.indexes();
    const legacyUniqueIndexes = indexes.filter(
      (index) => index.unique && index.name !== "_id_"
    );

    for (const index of legacyUniqueIndexes) {
      await MembershipPrice.collection.dropIndex(index.name);
    }

    membershipPriceIndexChecked = true;
  } catch (err) {
    if (err?.codeName === "NamespaceNotFound") {
      return;
    }
    throw err;
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ msg: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: "admin" });
  } catch (err) {
    next(err);
  }
};

const adminSummary = async (req, res, next) => {
  try {
    const [
      totalMembers,
      lifetimeMembers,
      oneTimeMembers,
      pendingMembershipRequests,
      pendingPaymentRequests,
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ membershipType: "lifetime" }),
      Member.countDocuments({ membershipType: { $in: ["one-time", "onetime"] } }),
      Member.countDocuments({ status: "pending" }),
      Payment.countDocuments({ status: "pending" }),
    ]);

    res.json({
      totalMembers,
      lifetimeMembers,
      oneTimeMembers,
      pendingMembershipRequests,
      pendingPaymentRequests,
    });
  } catch (err) {
    next(err);
  }
};

const getNextMemberId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "member" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  return `MBR-${year}-${String(counter.seq).padStart(5, "0")}`;
};

const normalizeType = (membershipType) => {
  if (membershipType === "onetime") return "one-time";
  return membershipType;
};

const getMembershipPlan = async (membershipPriceId) => {
  let priceDoc = null;
  if (membershipPriceId) {
    priceDoc = await MembershipPrice.findById(membershipPriceId);
  }
  if (!priceDoc) {
    priceDoc = await MembershipPrice.findOne().sort({ createdAt: -1 });
  }

  return {
    fee: Number(priceDoc?.price || 0),
    planName: priceDoc?.name || "Membership Plan",
    planId: priceDoc?._id ? String(priceDoc._id) : undefined,
  };
};

const listAdminMembers = async (req, res, next) => {
  try {
    const { q, status, type, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) {
      query.membershipType = type === "onetime" ? { $in: ["one-time", "onetime"] } : type;
    }
    if (q) {
      query.$or = [
        { fullName: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { mobile: new RegExp(q, "i") },
        { memberId: new RegExp(q, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Member.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Member.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

const getAdminMemberById = async (req, res, next) => {
  try {
    const identifier = String(req.params.id || "").trim();
    let member = mongoose.Types.ObjectId.isValid(identifier)
      ? await Member.findOne({
          $or: [{ _id: identifier }, { memberId: identifier }],
        })
      : await Member.findOne({ memberId: identifier });

    if (!member && mongoose.Types.ObjectId.isValid(identifier)) {
      const linkedUser = await User.findById(identifier).select("email phone");
      if (linkedUser) {
        member = await Member.findOne({
          $or: [
            { email: linkedUser.email?.toLowerCase() },
            { mobile: linkedUser.phone },
          ],
        });
      }
    }

    if (!member) return res.status(404).json({ msg: "Member not found" });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

const createAdminMember = async (req, res, next) => {
  try {
    const {
      fullName,
      fatherName,
      mobile,
      email,
      address,
      occupation,
      annualIncome,
      membershipPriceId,
      password,
      status,
    } = req.body;

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) return res.status(400).json({ msg: "User already exists with this email" });

    const memberId = await getNextMemberId();
    const normalizedType = "one-time";
    const selectedPlan = await getMembershipPlan(membershipPriceId);

    const user = await User.create({
      name: fullName,
      email: email?.toLowerCase(),
      phone: mobile,
      password: password || mobile,
      address,
      membershipType: "onetime",
      membershipStatus: status || "approved",
      role: "member",
    });

    const member = await Member.create({
      memberId,
      fullName,
      fatherName,
      mobile,
      email: email?.toLowerCase(),
      address,
      occupation,
      annualIncome,
      membershipType: normalizedType,
      membershipPlanId: selectedPlan.planId,
      membershipPlanName: selectedPlan.planName,
      membershipFee: selectedPlan.fee,
      status: status || "approved",
    });

    res.status(201).json({ user, member });
  } catch (err) {
    next(err);
  }
};

const updateAdminMember = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.membershipPriceId) {
      const selectedPlan = await getMembershipPlan(updates.membershipPriceId);
      updates.membershipFee = selectedPlan.fee;
      updates.membershipPlanName = selectedPlan.planName;
      updates.membershipPlanId = selectedPlan.planId;
      updates.membershipType = "one-time";
    }

    const member = await Member.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!member) return res.status(404).json({ msg: "Member not found" });

    await User.findOneAndUpdate(
      { email: member.email },
      {
        name: member.fullName,
        phone: member.mobile,
        address: member.address,
        membershipType: member.membershipType === "one-time" ? "onetime" : member.membershipType,
        membershipStatus: member.status,
      }
    );

    res.json(member);
  } catch (err) {
    next(err);
  }
};

const updateAdminMemberStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const member = await Member.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!member) return res.status(404).json({ msg: "Member not found" });

    await User.findOneAndUpdate(
      { email: member.email },
      { membershipStatus: status }
    );

    res.json(member);
  } catch (err) {
    next(err);
  }
};

const deleteAdminMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ msg: "Member not found" });

    await User.findOneAndDelete({ email: member.email });
    res.json({ message: "Member deleted" });
  } catch (err) {
    next(err);
  }
};

const listAdminPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Payment.find(query)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!payment) return res.status(404).json({ msg: "Payment not found" });
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

const listMembershipPrices = async (req, res, next) => {
  try {
    await ensureMembershipPriceIndexes();
    const prices = await MembershipPrice.find().sort({ createdAt: -1 });
    const normalized = prices.map((item) => {
      const value = item.toObject();
      return {
        ...value,
        name: value.name?.trim() || `Plan ${value.price || 0}`,
      };
    });
    res.json(normalized);
  } catch (err) {
    next(err);
  }
};

const createMembershipPrice = async (req, res, next) => {
  const normalizedName = String(req.body?.name || "").trim();
  const parsedPrice = Number(req.body?.price);

  if (!normalizedName) {
    return res.status(400).json({ msg: "Plan name is required" });
  }

  const createDoc = () =>
    MembershipPrice.create({
      name: normalizedName,
      price: parsedPrice,
    });

  try {
    await ensureMembershipPriceIndexes(true);
    const doc = await createDoc();
    res.status(201).json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      await ensureMembershipPriceIndexes(true);
      try {
        const retryDoc = await createDoc();
        return res.status(201).json(retryDoc);
      } catch (error_) {
        if (error_?.code === 11000) {
          return res.status(409).json({
            msg: "Duplicate unique index conflict in DB. Restart server once and try again.",
          });
        }
        return next(error_);
      }
    }
    return next(err);
  }
};

const updateMembershipPrice = async (req, res, next) => {
  try {
    await ensureMembershipPriceIndexes();
    const { name, price } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (price === undefined) {
      // no-op
    } else {
      updates.price = Number(price);
    }
    const doc = await MembershipPrice.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!doc) return res.status(404).json({ msg: "Price not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

const deleteMembershipPrice = async (req, res, next) => {
  try {
    const doc = await MembershipPrice.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Price not found" });
    res.json({ message: "Price deleted" });
  } catch (err) {
    next(err);
  }
};

const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await AdminSettings.findOne();
    res.json(
      settings || {
        qrCodeImage: "",
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        upiId: "",
      }
    );
  } catch (err) {
    next(err);
  }
};

const updatePaymentDetails = async (req, res, next) => {
  try {
    const {
      bankName = "",
      accountHolderName = "",
      accountNumber = "",
      ifscCode = "",
      upiId = "",
    } = req.body;

    const settings = await AdminSettings.findOneAndUpdate(
      {},
      {
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode,
        upiId,
      },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    next(err);
  }
};

const uploadQrCode = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "QR image required" });

    const settings = await AdminSettings.findOneAndUpdate(
      {},
      { qrCodeImage: `/uploads/qr/${req.file.filename}` },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminLogin,
  adminSummary,
  listAdminMembers,
  getAdminMemberById,
  createAdminMember,
  updateAdminMember,
  updateAdminMemberStatus,
  deleteAdminMember,
  listAdminPayments,
  updatePaymentStatus,
  listMembershipPrices,
  createMembershipPrice,
  updateMembershipPrice,
  deleteMembershipPrice,
  getAdminSettings,
  uploadQrCode,
  updatePaymentDetails,
};
