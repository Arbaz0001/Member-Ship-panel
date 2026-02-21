const router = require("express").Router();
const path = require("node:path");
const { auth, requireAdmin, requireMember } = require("../middleware/auth");
const { createUploader } = require("../utils/upload");
const {
  submitPayment,
  listMyPayments,
  listAllPayments,
} = require("../controllers/paymentController");

const paymentUpload = createUploader(
  path.join(__dirname, "..", "uploads", "payments")
);

router.post("/submit", auth, requireMember, paymentUpload.single("screenshot"), submitPayment);
router.get("/mine", auth, requireMember, listMyPayments);
router.get("/", auth, requireAdmin, listAllPayments);

module.exports = router;
