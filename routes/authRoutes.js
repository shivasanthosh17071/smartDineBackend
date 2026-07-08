const express = require("express");
const router = express.Router();
const { register, login, getMe, updateMe, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.post("/register", validate(["name", "email", "password"]), register);
router.post("/login", validate(["email", "password"]), login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.post("/logout", protect, logout);

module.exports = router;
