const express = require("express");
const router = express.Router();
const { createReview, getReviews } = require("../controllers/reviewController");
const { optionalAuth, protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

router.post("/", optionalAuth, createReview);
router.get("/", protect, authorize(ROLES.ADMIN), getReviews);

module.exports = router;
