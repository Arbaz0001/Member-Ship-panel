const router = require("express").Router();
const path = require("node:path");
const { auth, requireAdmin } = require("../middleware/auth");
const {
  getSettings,
  updatePrices,
  uploadQr,
  updatePaymentDetails,
} = require("../controllers/settingsController");
const { createUploader } = require("../utils/upload");

const qrUpload = createUploader(path.join(__dirname, "..", "uploads", "qr"));

router.get("/", getSettings);
router.put("/", auth, requireAdmin, updatePrices);
router.put("/payment-details", auth, requireAdmin, updatePaymentDetails);
router.post("/qr", auth, requireAdmin, qrUpload.single("qrImage"), uploadQr);

module.exports = router;
