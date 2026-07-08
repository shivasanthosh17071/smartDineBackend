const express = require("express");
const router = express.Router();
const {
  getSalesOverview,
  getTopItems,
  getPrepTimeAnalytics,
  getSentimentSummary,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

router.use(protect, authorize(ROLES.ADMIN, ROLES.KITCHEN));

router.get("/sales", authorize(ROLES.ADMIN), getSalesOverview);
router.get("/top-items", authorize(ROLES.ADMIN), getTopItems);
router.get("/prep-times", getPrepTimeAnalytics);
router.get("/sentiment", authorize(ROLES.ADMIN), getSentimentSummary);

module.exports = router;
