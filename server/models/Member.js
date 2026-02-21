const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    occupation: { type: String, required: true, trim: true },
    annualIncome: { type: Number, required: true },
    membershipType: {
      type: String,
      enum: ["lifetime", "one-time"],
      required: true,
    },
    membershipPlanId: { type: String, trim: true },
    membershipPlanName: { type: String, trim: true },
    membershipFee: { type: Number, required: true },
    profileImage: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
