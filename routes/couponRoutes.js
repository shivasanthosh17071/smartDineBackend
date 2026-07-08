const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

router.post("/validate", validateCoupon); // public

router.post("/", protect, authorize(ROLES.ADMIN), createCoupon);
router.get("/", protect, authorize(ROLES.ADMIN), getCoupons);
router.put("/:id", protect, authorize(ROLES.ADMIN), updateCoupon);
router.delete("/:id", protect, authorize(ROLES.ADMIN), deleteCoupon);

module.exports = router;
