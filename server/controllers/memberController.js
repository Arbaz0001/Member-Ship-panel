const bcrypt = require("bcryptjs");
const { Parser } = require("json2csv");
const Counter = require("../models/Counter");
const Member = require("../models/Member");
const MembershipPrice = require("../models/MembershipPrice");
const User = require("../models/User");

const FIXED_PRICE_TYPES = [
  { type: "lifetime", name: "Lifetime" },
  { type: "two-year", name: "Two Year" },
];

const getNextMemberId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "member" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  return `MBR-${year}-${String(counter.seq).padStart(5, "0")}`;
};

const normalizeMembershipType = (membershipType) => {
  if (membershipType === "lifetime") return "lifetime";
  return "two-year";
};

const inferTypeFromName = (name) => {
  const normalized = String(name || "").trim().toLowerCase();
  if (normalized.includes("life")) return "lifetime";
  if (normalized.includes("two") || normalized.includes("year") || normalized.includes("one")) {
    return "two-year";
  }
  return "two-year";
};

const ensureFixedMembershipPrices = async () => {
  const allPrices = await MembershipPrice.find().sort({ createdAt: -1 });
  const explicitByType = new Map();
  const inferredByType = new Map();

  for (const item of allPrices) {
    if (item.type && !explicitByType.has(item.type)) {
      explicitByType.set(item.type, item);
      continue;
    }

    const inferredType = inferTypeFromName(item.name);
    if (!inferredByType.has(inferredType)) {
      inferredByType.set(inferredType, item);
    }
  }

  const docs = [];
  for (const fixed of FIXED_PRICE_TYPES) {
    const matched = explicitByType.get(fixed.type) || inferredByType.get(fixed.type);
    const price = Number(matched?.price || 0);

    const sameTypeDocs = await MembershipPrice.find({ type: fixed.type }).sort({ updatedAt: -1, createdAt: -1 });
    let doc = sameTypeDocs[0] || null;
    if (!doc) {
      doc = await MembershipPrice.create({
        type: fixed.type,
        name: fixed.name,
        price,
      });
    } else {
      doc = await MembershipPrice.findByIdAndUpdate(
        doc._id,
        { type: fixed.type, name: fixed.name, price },
        { new: true }
      );

      const duplicateIds = sameTypeDocs.slice(1).map((item) => item._id);
      if (duplicateIds.length) {
        await MembershipPrice.deleteMany({ _id: { $in: duplicateIds } });
      }
    }

    docs.push(doc);
  }

  return docs;
};

const getMembershipPlanByType = async (membershipType) => {
  await ensureFixedMembershipPrices();
  const normalizedType = normalizeMembershipType(membershipType);
  const priceDoc = await MembershipPrice.findOne({ type: normalizedType }).sort({ updatedAt: -1, createdAt: -1 });

  return {
    fee: Number(priceDoc?.price || 0),
    planName: normalizedType === "lifetime" ? "Lifetime" : "Two Year",
    planId: priceDoc?._id ? String(priceDoc._id) : undefined,
  };
};

const applyMembership = async (req, res, next) => {
  try {
    const {
      fullName,
      fatherName,
      mobile,
      email,
      address,
      occupation,
      annualIncome,
      membershipType,
    } = req.body;

    const normalizedType = normalizeMembershipType(membershipType);
    const selectedPlan = await getMembershipPlanByType(normalizedType);

    const memberId = await getNextMemberId();

    const member = await Member.create({
      memberId,
      fullName,
      fatherName,
      mobile,
      email,
      address,
      occupation,
      annualIncome,
      membershipType: normalizedType,
      membershipPlanId: selectedPlan.planId,
      membershipPlanName: selectedPlan.planName,
      membershipFee: selectedPlan.fee,
      profileImage: req.file ? `/uploads/profiles/${req.file.filename}` : undefined,
      status: "pending",
    });

    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (!existingUser) {
      await User.create({
        name: fullName,
        email: email?.toLowerCase(),
        phone: mobile,
        password: mobile,
        address,
        membershipType: normalizedType === "lifetime" ? "lifetime" : "two-year",
        membershipStatus: "pending",
        role: "member",
      });
    }

    res.status(201).json({
      message: "Membership submitted. Status is pending.",
      member,
    });
  } catch (err) {
    next(err);
  }
};

const listMembers = async (req, res, next) => {
  try {
    const { status, q, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
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

const listPublicMembers = async (req, res, next) => {
  try {
    const { q, type, page = 1, limit = 10 } = req.query;
    const query = { status: "approved" };
    if (type) {
      if (type === "two-year" || type === "one-time" || type === "onetime") {
        query.membershipType = { $in: ["two-year", "one-time", "onetime"] };
      } else {
        query.membershipType = type;
      }
    }
    if (q) {
      query.$or = [
        { fullName: new RegExp(q, "i") },
        { memberId: new RegExp(q, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Member.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Member.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    const member = await Member.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!member) return res.status(404).json({ msg: "Member not found" });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!member) return res.status(404).json({ msg: "Member not found" });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ msg: "Member not found" });
    res.json({ message: "Member deleted" });
  } catch (err) {
    next(err);
  }
};

const stats = async (req, res, next) => {
  try {
    const totalMembers = await Member.countDocuments({ status: "approved" });
    const lifetimeMembers = await Member.countDocuments({
      status: "approved",
      membershipType: "lifetime",
    });
    const twoYearMembers = await Member.countDocuments({
      status: "approved",
      membershipType: { $in: ["two-year", "one-time", "onetime"] },
    });

    res.json({ totalMembers, lifetimeMembers, twoYearMembers, oneTimeMembers: twoYearMembers });
  } catch (err) {
    next(err);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 }).lean();
    const parser = new Parser({
      fields: [
        "memberId",
        "fullName",
        "fatherName",
        "mobile",
        "email",
        "membershipType",
        "membershipFee",
        "status",
        "createdAt",
      ],
    });
    const csv = parser.parse(members);
    res.header("Content-Type", "text/csv");
    res.attachment("members.csv");
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

const getMyMemberProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const member = await Member.findOne({ email: user.email?.toLowerCase() });
    if (!member) return res.status(404).json({ msg: "Member profile not found" });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyMembership,
  listMembers,
  listPublicMembers,
  updateMember,
  updateStatus,
  deleteMember,
  stats,
  exportCsv,
  getMyMemberProfile,
};
