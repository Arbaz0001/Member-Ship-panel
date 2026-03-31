
const router = require("express").Router();
const path = require("node:path");
const { registerUser, loginUser, getCurrentUser } = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { createUploader } = require("../utils/upload");

const profileUpload = createUploader(
  path.join(__dirname, "..", "uploads", "profiles")
);

router.post("/register", profileUpload.single("profileImage"), registerUser);
router.post("/login", loginUser);
router.get("/me", auth, getCurrentUser);

module.exports = router;
