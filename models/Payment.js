const mongoose = require("mongoose");
const { PAYMENT_STATUS, PAYMENT_MODE } = require("../config/constants");

const splitSchema = new mongoose.Schema(
  {
    payerName: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paidAt: { type: Date },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    sessionId: { type: String, required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    mode: {
      type: String,
      enum: Object.values(PAYMENT_MODE),
      default: PAYMENT_MODE.PAY_LATER,
    },
    totalAmount: { type: Number, required: true },
    tipAmount: { type: Number, default: 0 },
    splits: [splitSchema],
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    provider: { type: String, default: "mock" }, // razorpay, stripe, mock
    providerOrderId: { type: String },
    providerPaymentId: { type: String },
    paidAt: { type: Date },
    invoiceNumber: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
