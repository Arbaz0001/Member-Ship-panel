const Counter = require("../models/Counter");
const MembershipPrice = require("../models/MembershipPrice");

const normalizeMembershipType = (membershipType) => {
  if (membershipType === "lifetime") return "lifetime";
  if (membershipType === "one-time" || membershipType === "onetime") return "one-time";
  return "two-year";
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

const getMembershipPlan = async ({ membershipType, membershipPriceId }) => {
  const normalizedType = normalizeMembershipType(membershipType);

  let priceDoc = null;
  if (membershipPriceId) {
    priceDoc = await MembershipPrice.findById(membershipPriceId);
  }

  if (!priceDoc) {
    priceDoc = await MembershipPrice.findOne({ type: normalizedType }).sort({
      updatedAt: -1,
      createdAt: -1,
    });
  }

  return {
    normalizedType,
    planId: priceDoc?._id ? String(priceDoc._id) : undefined,
    planName:
      priceDoc?.name ||
      (normalizedType === "lifetime"
        ? "Lifetime"
        : normalizedType === "one-time"
          ? "One Time"
          : "Two Year"),
    fee: Number(priceDoc?.price || 0),
  };
};

module.exports = {
  getMembershipPlan,
  getNextMemberId,
  normalizeMembershipType,
};
