
const router = require("express").Router();
const path = require("node:path");
const { auth, requireAdmin, requireMember } = require("../middleware/auth");
const { registerUser } = require("../controllers/authController");
const {
	listMembers,
	listPublicMembers,
	updateMember,
	updateStatus,
	deleteMember,
	stats,
	exportCsv,
	getMyMemberProfile,
} = require("../controllers/memberController");
const { createUploader } = require("../utils/upload");

const profileUpload = createUploader(
	path.join(__dirname, "..", "uploads", "profiles")
);

router.get("/stats", stats);
router.get("/public", listPublicMembers);
router.post("/apply", profileUpload.single("profileImage"), registerUser);
router.get("/me", auth, requireMember, getMyMemberProfile);

router.get("/", auth, requireAdmin, listMembers);
router.get("/export", auth, requireAdmin, exportCsv);
router.put("/:id", auth, requireAdmin, updateMember);
router.patch("/:id/status", auth, requireAdmin, updateStatus);
router.delete("/:id", auth, requireAdmin, deleteMember);

module.exports = router;
