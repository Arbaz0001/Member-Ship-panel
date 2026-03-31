const { Parser } = require("json2csv");
const Member = require("../models/Member");
const User = require("../models/User");

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

    res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
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

    res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
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
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, member });
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
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, message: "Member deleted" });
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

    res.json({ success: true, totalMembers, lifetimeMembers, twoYearMembers, oneTimeMembers: twoYearMembers });
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const member = await Member.findOne({ email: user.email?.toLowerCase() });
    if (!member) return res.status(404).json({ success: false, message: "Member profile not found" });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listMembers,
  listPublicMembers,
  updateMember,
  updateStatus,
  deleteMember,
  stats,
  exportCsv,
  getMyMemberProfile,
};
