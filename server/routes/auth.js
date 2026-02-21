
const router = require("express").Router();
const { loginUser, getCurrentUser } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

router.post("/login", loginUser);
router.get("/me", auth, getCurrentUser);

module.exports = router;
