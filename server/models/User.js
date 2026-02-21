const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    membershipType: {
      type: String,
      enum: ["lifetime", "onetime"],
      required: true,
    },
    membershipStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    role: { type: String, enum: ["admin", "member"], default: "member" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
