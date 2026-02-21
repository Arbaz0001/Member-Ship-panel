const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    qrCodeImage: { type: String, default: "", trim: true },
    bankName: { type: String, default: "", trim: true },
    accountHolderName: { type: String, default: "", trim: true },
    accountNumber: { type: String, default: "", trim: true },
    ifscCode: { type: String, default: "", trim: true },
    upiId: { type: String, default: "", trim: true },
  },
  { timestamps: false }
);

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
