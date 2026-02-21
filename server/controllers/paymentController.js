const Payment = require("../models/Payment");

const submitPayment = async (req, res, next) => {
  try {
    if (req.user?.role !== "member") {
      return res.status(403).json({ msg: "Member only" });
    }
    const { amount, category = "blindDonation" } = req.body;

    if (!req.file) return res.status(400).json({ msg: "Payment screenshot is required" });

    const payment = await Payment.create({
      userId: req.user.id,
      category,
      amount: Number(amount || 0),
      screenshot: `/uploads/payments/${req.file.filename}`,
    });

    res.status(201).json({ message: "Payment submitted successfully", payment });
  } catch (err) {
    next(err);
  }
};

const listMyPayments = async (req, res, next) => {
  try {
    if (req.user?.role !== "member") {
      return res.status(403).json({ msg: "Member only" });
    }
    const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

const listAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitPayment,
  listMyPayments,
  listAllPayments,
};
