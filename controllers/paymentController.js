const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const { generateInvoiceNumber } = require("../utils/invoiceGenerator");
const { PAYMENT_STATUS, PAYMENT_MODE, SOCKET_EVENTS } = require("../config/constants");
const { emitToBranch, emitToTable } = require("../sockets");

// @desc    Create a payment request for a table session (aggregates all orders in session)
// @route   POST /api/payments
// @access  Public (guest/customer)
const createPayment = asyncHandler(async (req, res) => {
  const { tableId, sessionId, mode, tipAmount, splits } = req.body;

  const orders = await Order.find({
    table: tableId,
    sessionId,
    status: { $ne: "cancelled" },
  });

  if (orders.length === 0) {
    res.status(400);
    throw new Error("No orders found for this session");
  }

  const orderTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAmount = orderTotal + (tipAmount || 0);

  const order = await Order.findById(orders[0]._id); // for branch ref
  const payment = await Payment.create({
    branch: order.branch,
    table: tableId,
    sessionId,
    orders: orders.map((o) => o._id),
    mode: mode || PAYMENT_MODE.PAY_LATER,
    totalAmount,
    tipAmount: tipAmount || 0,
    splits: splits || [],
    status: PAYMENT_STATUS.PENDING,
    provider: process.env.PAYMENT_PROVIDER || "mock",
  });

  emitToBranch(order.branch, SOCKET_EVENTS.PAYMENT_UPDATED, {
    paymentId: payment._id,
    status: payment.status,
  });

  res.status(201).json({ success: true, payment });
});

// @desc    Confirm/process a payment (mock provider - in production this would be a webhook)
// @route   POST /api/payments/:id/confirm
// @access  Public
const confirmPayment = asyncHandler(async (req, res) => {
  const { providerPaymentId, splitId } = req.body;
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.mode === PAYMENT_MODE.SPLIT && splitId) {
    const split = payment.splits.id(splitId);
    if (!split) {
      res.status(404);
      throw new Error("Split entry not found");
    }
    split.status = PAYMENT_STATUS.PAID;
    split.paidAt = new Date();

    const allPaid = payment.splits.every((s) => s.status === PAYMENT_STATUS.PAID);
    payment.status = allPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL;
  } else {
    payment.status = PAYMENT_STATUS.PAID;
    payment.paidAt = new Date();
  }

  payment.providerPaymentId = providerPaymentId || `mock_${Date.now()}`;
  if (payment.status === PAYMENT_STATUS.PAID && !payment.invoiceNumber) {
    payment.invoiceNumber = generateInvoiceNumber();
  }
  await payment.save();

  emitToBranch(payment.branch, SOCKET_EVENTS.PAYMENT_UPDATED, {
    paymentId: payment._id,
    status: payment.status,
  });
  emitToTable(payment.table, payment.sessionId, SOCKET_EVENTS.PAYMENT_UPDATED, {
    paymentId: payment._id,
    status: payment.status,
  });

  res.json({ success: true, payment });
});

// @desc    Get payments (filterable)
// @route   GET /api/payments?branch=&status=&sessionId=
// @access  Private/Cashier,Admin
const getPayments = asyncHandler(async (req, res) => {
  const { branch, status, sessionId } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (status) filter.status = status;
  if (sessionId) filter.sessionId = sessionId;

  const payments = await Payment.find(filter)
    .populate("table", "tableNumber")
    .populate("orders")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: payments.length, payments });
});

// @desc    Get single payment / invoice
// @route   GET /api/payments/:id
// @access  Private/Cashier,Admin or Public (own session)
const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("table", "tableNumber")
    .populate("orders");
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }
  res.json({ success: true, payment });
});

// @desc    Apply a manual discount/complimentary adjustment (cashier action)
// @route   PATCH /api/payments/:id/adjust
// @access  Private/Cashier,Admin
const adjustPayment = asyncHandler(async (req, res) => {
  const { discountAmount, reason } = req.body;
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }
  payment.totalAmount = Math.max(0, payment.totalAmount - (discountAmount || 0));
  await payment.save();
  res.json({ success: true, payment, note: reason });
});

// @desc    End-of-day settlement report
// @route   GET /api/payments/reports/eod?branch=&date=
// @access  Private/Cashier,Admin
const getEODReport = asyncHandler(async (req, res) => {
  const { branch, date } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const filter = {
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    status: PAYMENT_STATUS.PAID,
  };
  if (branch) filter.branch = branch;

  const payments = await Payment.find(filter);
  const totalRevenue = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalTips = payments.reduce((sum, p) => sum + p.tipAmount, 0);

  res.json({
    success: true,
    report: {
      date: startOfDay.toISOString().slice(0, 10),
      totalTransactions: payments.length,
      totalRevenue,
      totalTips,
    },
  });
});

module.exports = {
  createPayment,
  confirmPayment,
  getPayments,
  getPayment,
  adjustPayment,
  getEODReport,
};
