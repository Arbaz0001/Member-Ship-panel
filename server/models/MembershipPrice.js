const mongoose = require("mongoose");

const membershipPriceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lifetime", "two-year"],
      default: "two-year",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MembershipPrice", membershipPriceSchema);
