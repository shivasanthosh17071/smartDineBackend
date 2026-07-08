const mongoose = require("mongoose");
const { ORDER_STATUS } = require("../config/constants");

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true }, // snapshot at order time
    price: { type: Number, required: true }, // snapshot price
    quantity: { type: Number, required: true, min: 1, default: 1 },
    spiceLevel: { type: String },
    portionSize: { type: String },
    addOns: [
      {
        name: String,
        price: Number,
      },
    ],
    specialInstructions: { type: String, trim: true }, // "no onions"
    itemStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS) },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    sessionId: { type: String, required: true }, // groups orders within one dining session
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional (guest orders allowed)
    guestName: { type: String, trim: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    serviceCharge: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, trim: true },
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },
    statusHistory: [statusHistorySchema],
    isUrgent: { type: Boolean, default: false },
    estimatedReadyAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ branch: 1, status: 1 });
orderSchema.index({ table: 1, sessionId: 1 });

module.exports = mongoose.model("Order", orderSchema);
