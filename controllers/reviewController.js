const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");

// Very lightweight sentiment heuristic placeholder.
// In production, swap with a real NLP service/model.
const detectSentiment = (comment = "", rating = 3) => {
  const negativeWords = ["bad", "slow", "cold", "rude", "terrible", "worst", "awful", "late"];
  const positiveWords = ["great", "amazing", "excellent", "friendly", "fast", "delicious", "love"];
  const text = comment.toLowerCase();

  const hasNegative = negativeWords.some((w) => text.includes(w));
  const hasPositive = positiveWords.some((w) => text.includes(w));

  if (rating <= 2 || (hasNegative && !hasPositive)) return "negative";
  if (rating >= 4 || hasPositive) return "positive";
  return "neutral";
};

// @desc    Submit a review for an order
// @route   POST /api/reviews
// @access  Public
const createReview = asyncHandler(async (req, res) => {
  const {
    orderId,
    overallRating,
    foodRating,
    serviceRating,
    comment,
    tipAmount,
    itemReviews,
    guestName,
  } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const sentiment = detectSentiment(comment, overallRating);

  const review = await Review.create({
    branch: order.branch,
    order: order._id,
    table: order.table,
    customer: req.user?._id,
    guestName,
    overallRating,
    foodRating,
    serviceRating,
    comment,
    sentiment,
    tipAmount,
    itemReviews,
  });

  // Update aggregate rating on menu items
  if (itemReviews?.length) {
    for (const ir of itemReviews) {
      const item = await MenuItem.findById(ir.menuItem);
      if (item) {
        const newCount = item.ratingCount + 1;
        item.avgRating = (item.avgRating * item.ratingCount + ir.rating) / newCount;
        item.ratingCount = newCount;
        await item.save();
      }
    }
  }

  res.status(201).json({ success: true, review });
});

// @desc    Get reviews (filterable, flags negative sentiment for admin attention)
// @route   GET /api/reviews?branch=&sentiment=
// @access  Private/Admin
const getReviews = asyncHandler(async (req, res) => {
  const { branch, sentiment } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (sentiment) filter.sentiment = sentiment;

  const reviews = await Review.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

module.exports = { createReview, getReviews };
