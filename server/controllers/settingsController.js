const MembershipPrice = require("../models/MembershipPrice");
const AdminSettings = require("../models/AdminSettings");

let membershipPriceIndexChecked = false;

const ensureMembershipPriceIndexes = async (force = false) => {
  if (membershipPriceIndexChecked && !force) return;
  try {
    const indexes = await MembershipPrice.collection.indexes();
    const legacyUniqueIndexes = indexes.filter(
      (index) => index.unique && index.name !== "_id_"
    );

    for (const index of legacyUniqueIndexes) {
      await MembershipPrice.collection.dropIndex(index.name);
    }

    membershipPriceIndexChecked = true;
  } catch (err) {
    if (err?.codeName === "NamespaceNotFound") {
      return;
    }
    throw err;
  }
};

const getSettings = async (req, res, next) => {
  try {
    await ensureMembershipPriceIndexes();
    const [prices, adminSettings] = await Promise.all([
      MembershipPrice.find().sort({ createdAt: -1 }),
      AdminSettings.findOne(),
    ]);

    const membershipOptions = prices.map((item) => ({
      _id: String(item._id),
      name: item.name?.trim() || `Plan ${Number(item.price || 0)}`,
      price: Number(item.price || 0),
    }));
    const defaultPrice = membershipOptions[0]?.price || 0;

    res.json({
      lifetimePrice: Number(defaultPrice),
      oneTimePrice: Number(defaultPrice),
      membershipOptions,
      paymentQrImage: adminSettings?.qrCodeImage || "",
      bankName: adminSettings?.bankName || "",
      accountHolderName: adminSettings?.accountHolderName || "",
      accountNumber: adminSettings?.accountNumber || "",
      ifscCode: adminSettings?.ifscCode || "",
      upiId: adminSettings?.upiId || "",
    });
  } catch (err) {
    next(err);
  }
};

const updatePrices = async (req, res, next) => {
  try {
    const { lifetimePrice, oneTimePrice } = req.body;
    const fallbackPrice = Number(lifetimePrice ?? oneTimePrice ?? 0);
    await MembershipPrice.findOneAndUpdate(
      { name: "Default Plan" },
      { name: "Default Plan", price: fallbackPrice },
      { new: true, upsert: true }
    );

    return getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

const uploadQr = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "QR image required" });

    await AdminSettings.findOneAndUpdate(
      {},
      { qrCodeImage: `/uploads/qr/${req.file.filename}` },
      { new: true, upsert: true }
    );

    return getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

const updatePaymentDetails = async (req, res, next) => {
  try {
    const {
      bankName = "",
      accountHolderName = "",
      accountNumber = "",
      ifscCode = "",
      upiId = "",
    } = req.body;

    await AdminSettings.findOneAndUpdate(
      {},
      {
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode,
        upiId,
      },
      { new: true, upsert: true }
    );

    return getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updatePrices, uploadQr, updatePaymentDetails };
