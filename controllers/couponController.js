const asyncHandler = require("express-async-handler");
const Coupon = require("../models/Coupon");

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

// @desc    Get coupons for a branch
// @route   GET /api/coupons?branch=
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.branch) filter.branch = req.query.branch;
  const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: coupons.length, coupons });
});

// @desc    Validate a coupon code against an order subtotal (used by customer app before applying)
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, branch, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), branch, isActive: true });

  if (
    !coupon ||
    (coupon.validTo && coupon.validTo < new Date()) ||
    subtotal < coupon.minOrderAmount ||
    (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
  ) {
    res.status(400);
    throw new Error("Coupon is invalid or not applicable");
  }

  let discount =
    coupon.discountType === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);

  res.json({ success: true, valid: true, discountAmount: Number(discount.toFixed(2)) });
});

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  res.json({ success: true, coupon });
});

// @desc    Delete (deactivate) a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  res.json({ success: true, message: "Coupon deactivated" });
});

module.exports = { createCoupon, getCoupons, validateCoupon, updateCoupon, deleteCoupon };
