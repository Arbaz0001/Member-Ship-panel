const bcrypt = require("bcryptjs");
const { Parser } = require("json2csv");
const Counter = require("../models/Counter");
const Member = require("../models/Member");
const MembershipPrice = require("../models/MembershipPrice");
const User = require("../models/User");

const getNextMemberId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "member" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  return `MBR-${year}-${String(counter.seq).padStart(5, "0")}`;
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
      membershipPriceId,
    } = req.body;

    let selectedPrice = null;
    if (membershipPriceId) {
      selectedPrice = await MembershipPrice.findById(membershipPriceId);
    }

    if (!selectedPrice) {
      selectedPrice = await MembershipPrice.findOne().sort({ createdAt: -1 });
    }

    const normalizedType = "one-time";
    const membershipFee = Number(selectedPrice?.price || 0);
    const membershipPlanName = selectedPrice?.name || "Membership Plan";

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
      membershipPlanId: selectedPrice?._id ? String(selectedPrice._id) : undefined,
      membershipPlanName,
      membershipFee,
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
        membershipType: "onetime",
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
    const { q, page = 1, limit = 10 } = req.query;
    const query = { status: "approved" };
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
    const oneTimeMembers = await Member.countDocuments({
      status: "approved",
      membershipType: "one-time",
    });

    res.json({ totalMembers, lifetimeMembers, oneTimeMembers });
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
