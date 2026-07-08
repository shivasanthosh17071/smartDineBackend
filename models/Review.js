const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guestName: { type: String, trim: true },
    overallRating: { type: Number, min: 1, max: 5, required: true },
    foodRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
    tipAmount: { type: Number, default: 0 },
    itemReviews: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        rating: { type: Number, min: 1, max: 5 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
