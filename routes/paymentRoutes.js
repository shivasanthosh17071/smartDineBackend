const express = require("express");
const router = express.Router();
const {
  createPayment,
  confirmPayment,
  getPayments,
  getPayment,
  adjustPayment,
  getEODReport,
} = require("../controllers/paymentController");
const { optionalAuth, protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

router.get("/reports/eod", protect, authorize(ROLES.ADMIN, ROLES.CASHIER), getEODReport);

router.post("/", optionalAuth, createPayment);
router.post("/:id/confirm", optionalAuth, confirmPayment);
router.get("/", protect, authorize(ROLES.ADMIN, ROLES.CASHIER), getPayments);
router.get("/:id", optionalAuth, getPayment);
router.patch("/:id/adjust", protect, authorize(ROLES.ADMIN, ROLES.CASHIER), adjustPayment);

module.exports = router;
