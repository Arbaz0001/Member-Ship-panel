const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    lifetimePrice: { type: Number, default: 0 },
    oneTimePrice: { type: Number, default: 0 },
    paymentQrImage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
