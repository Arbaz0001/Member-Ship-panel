const MembershipPrice = require("../models/MembershipPrice");
const AdminSettings = require("../models/AdminSettings");

const FIXED_PRICE_TYPES = [
  { type: "lifetime", name: "Lifetime" },
  { type: "two-year", name: "Two Year" },
];

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

const inferTypeFromName = (name) => {
  const normalized = String(name || "").trim().toLowerCase();
  if (normalized.includes("life")) return "lifetime";
  if (normalized.includes("two") || normalized.includes("year") || normalized.includes("one")) {
    return "two-year";
  }
  return "two-year";
};

const ensureFixedMembershipPrices = async () => {
  await ensureMembershipPriceIndexes();

  // Simple, deterministic approach: ensure exactly one doc per type
  const docs = [];
  
  for (const fixed of FIXED_PRICE_TYPES) {
    console.log(`[ensureFixedMembershipPrices] Processing type: ${fixed.type}`);
    
    // Find ALL docs with this type
    const existingDocsByType = await MembershipPrice.find({ type: fixed.type }).sort({ updatedAt: -1, createdAt: -1 });
    console.log(`[ensureFixedMembershipPrices] Found ${existingDocsByType.length} existing docs for ${fixed.type}`);
    
    let doc;
    if (existingDocsByType.length === 0) {
      // Create new if none exists
      doc = await MembershipPrice.create({
        type: fixed.type,
        name: fixed.name,
        price: 0,
      });
      console.log(`[ensureFixedMembershipPrices] Created new ${fixed.type} doc:`, doc._id);
    } else {
      // Use the latest one
      doc = existingDocsByType[0];
      console.log(`[ensureFixedMembershipPrices] Using existing ${fixed.type} doc:`, doc._id, "price:", doc.price);
      
      // Remove duplicates if any
      if (existingDocsByType.length > 1) {
        const duplicateIds = existingDocsByType.slice(1).map(d => d._id);
        await MembershipPrice.deleteMany({ _id: { $in: duplicateIds } });
        console.log(`[ensureFixedMembershipPrices] Deleted ${duplicateIds.length} duplicate docs for ${fixed.type}`);
      }
    }
    
    docs.push(doc);
  }

  console.log(`[ensureFixedMembershipPrices] Returning ${docs.length} docs: lifetime=${docs[0]?._id}, two-year=${docs[1]?._id}`);
  return docs;
};

const getSettings = async (req, res, next) => {
  try {
    const [prices, adminSettings] = await Promise.all([
      ensureFixedMembershipPrices(),
      AdminSettings.findOne(),
    ]);

    const lifetimeDoc = prices.find((item) => item.type === "lifetime");
    const twoYearDoc = prices.find((item) => item.type === "two-year");
    const lifetimePrice = Number(lifetimeDoc?.price || 0);
    const twoYearPrice = Number(twoYearDoc?.price || 0);

    console.log("[getSettings] Lifetime doc:", lifetimeDoc ? "FOUND" : "NOT FOUND", "price:", lifetimePrice);
    console.log("[getSettings] Two-Year doc:", twoYearDoc ? "FOUND" : "NOT FOUND", "price:", twoYearPrice);

    const membershipOptions = [
      { _id: String(lifetimeDoc?._id || ""), type: "lifetime", name: "Lifetime", price: lifetimePrice },
      { _id: String(twoYearDoc?._id || ""), type: "two-year", name: "Two Year", price: twoYearPrice },
    ];

    res.json({
      lifetimePrice,
      twoYearPrice,
      oneTimePrice: twoYearPrice,
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
    const { lifetimePrice, twoYearPrice, oneTimePrice } = req.body;
    const resolvedTwoYear = Number(twoYearPrice ?? oneTimePrice ?? 0);

    await MembershipPrice.findOneAndUpdate(
      { type: "lifetime" },
      { type: "lifetime", name: "Lifetime", price: Number(lifetimePrice || 0) },
      { new: true, upsert: true }
    );
    await MembershipPrice.findOneAndUpdate(
      { type: "two-year" },
      { type: "two-year", name: "Two Year", price: resolvedTwoYear },
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
