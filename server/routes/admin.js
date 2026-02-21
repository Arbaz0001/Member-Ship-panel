const router = require("express").Router();
const path = require("node:path");
const {
	adminLogin,
	adminSummary,
	listAdminMembers,
	getAdminMemberById,
	createAdminMember,
	updateAdminMember,
	updateAdminMemberStatus,
	deleteAdminMember,
	listAdminPayments,
	updatePaymentStatus,
	listMembershipPrices,
	createMembershipPrice,
	updateMembershipPrice,
	deleteMembershipPrice,
	getAdminSettings,
	uploadQrCode,
	updatePaymentDetails,
} = require("../controllers/adminController");
const { auth, requireAdmin } = require("../middleware/auth");
const { createUploader } = require("../utils/upload");

const qrUpload = createUploader(path.join(__dirname, "..", "uploads", "qr"));

router.post("/login", adminLogin);
router.get("/debug", auth, requireAdmin, (req, res) => {
  res.json({ user: req.user, role: req.user?.role });
});
router.get("/dashboard", auth, requireAdmin, adminSummary);

router.get("/members", auth, requireAdmin, listAdminMembers);
router.get("/members/:id", auth, requireAdmin, getAdminMemberById);
router.post("/members", auth, requireAdmin, createAdminMember);
router.put("/members/:id", auth, requireAdmin, updateAdminMember);
router.patch("/members/:id/status", auth, requireAdmin, updateAdminMemberStatus);
router.delete("/members/:id", auth, requireAdmin, deleteAdminMember);

router.get("/payments", auth, requireAdmin, listAdminPayments);
router.patch("/payments/:id/status", auth, requireAdmin, updatePaymentStatus);

router.get("/membership-prices", auth, requireAdmin, listMembershipPrices);
router.post("/membership-prices", auth, requireAdmin, createMembershipPrice);
router.put("/membership-prices/:id", auth, requireAdmin, updateMembershipPrice);
router.delete("/membership-prices/:id", auth, requireAdmin, deleteMembershipPrice);

router.get("/settings", auth, requireAdmin, getAdminSettings);
router.post("/settings/qr", auth, requireAdmin, qrUpload.single("qrCodeImage"), uploadQrCode);
router.put("/settings/payment-details", auth, requireAdmin, updatePaymentDetails);

module.exports = router;
