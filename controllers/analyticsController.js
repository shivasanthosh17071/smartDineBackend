const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Review = require("../models/Review");

// @desc    Sales overview (revenue, order count, avg order value) over a date range
// @route   GET /api/analytics/sales?branch=&from=&to=
// @access  Private/Admin
const getSalesOverview = asyncHandler(async (req, res) => {
  const { branch, from, to } = req.query;
  const match = { status: { $ne: "cancelled" } };
  if (branch) match.branch = branch;
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const orders = await Order.find(match);
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

  res.json({
    success: true,
    overview: { totalRevenue, totalOrders, avgOrderValue },
  });
});

// @desc    Top-selling menu items
// @route   GET /api/analytics/top-items?branch=&limit=
// @access  Private/Admin
const getTopItems = asyncHandler(async (req, res) => {
  const { branch, limit } = req.query;
  const matchStage = branch ? { branch: new mongoose.Types.ObjectId(branch) } : {};

  const result = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" }, ...matchStage } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItem",
        name: { $first: "$items.name" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: Number(limit) || 10 },
  ]);

  res.json({ success: true, topItems: result });
});

// @desc    Kitchen prep-time analytics per dish
// @route   GET /api/analytics/prep-times?branch=
// @access  Private/Admin,Kitchen
const getPrepTimeAnalytics = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.branch) filter.branch = req.query.branch;

  const items = await MenuItem.find(filter)
    .select("name prepTimeMinutes category")
    .sort({ prepTimeMinutes: -1 });

  res.json({ success: true, items });
});

// @desc    Customer sentiment / feedback summary
// @route   GET /api/analytics/sentiment?branch=
// @access  Private/Admin
const getSentimentSummary = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.branch) filter.branch = req.query.branch;

  const [positive, neutral, negative, avgRatingAgg] = await Promise.all([
    Review.countDocuments({ ...filter, sentiment: "positive" }),
    Review.countDocuments({ ...filter, sentiment: "neutral" }),
    Review.countDocuments({ ...filter, sentiment: "negative" }),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: null, avgRating: { $avg: "$overallRating" } } },
    ]),
  ]);

  res.json({
    success: true,
    sentiment: { positive, neutral, negative },
    avgRating: avgRatingAgg[0]?.avgRating || 0,
  });
});

module.exports = {
  getSalesOverview,
  getTopItems,
  getPrepTimeAnalytics,
  getSentimentSummary,
};
