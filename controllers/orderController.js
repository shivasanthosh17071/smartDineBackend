const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Table = require("../models/Table");
const Coupon = require("../models/Coupon");
const { calculateOrderTotals } = require("../utils/orderCalculator");
const { ORDER_STATUS, TABLE_STATUS, SOCKET_EVENTS } = require("../config/constants");
const { emitToBranch, emitToTable, emitToRole } = require("../sockets");

// @desc    Place a new order (customer, via table session)
// @route   POST /api/orders
// @access  Public (guest) / Private (logged-in customer via optionalAuth)
const placeOrder = asyncHandler(async (req, res) => {
  const { tableId, sessionId, items, guestName, couponCode, notes } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("Order must contain at least one item");
  }

  const table = await Table.findById(tableId);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }

  // Validate items against DB (price integrity, availability, stock)
  const orderItems = [];
  for (const reqItem of items) {
    const menuItem = await MenuItem.findById(reqItem.menuItemId);
    if (!menuItem || !menuItem.isActive) {
      res.status(404);
      throw new Error(`Menu item not found: ${reqItem.menuItemId}`);
    }
    if (!menuItem.isAvailable) {
      res.status(400);
      throw new Error(`"${menuItem.name}" is currently unavailable`);
    }
    if (menuItem.stockCount !== null && menuItem.stockCount < reqItem.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for "${menuItem.name}"`);
    }

    const addOns = (reqItem.addOns || []).map((a) => {
      const found = menuItem.addOns.find((mo) => mo.name === a.name);
      return { name: a.name, price: found ? found.price : 0 };
    });

    orderItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: reqItem.quantity || 1,
      spiceLevel: reqItem.spiceLevel,
      portionSize: reqItem.portionSize,
      addOns,
      specialInstructions: reqItem.specialInstructions,
    });

    // Decrement stock if tracked
    if (menuItem.stockCount !== null) {
      menuItem.stockCount -= reqItem.quantity;
      await menuItem.save();
    }
  }

  // Apply coupon if provided
  let discountAmount = 0;
  let appliedCoupon = null;
  const totalsPreCoupon = calculateOrderTotals(orderItems);

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      branch: table.branch,
      isActive: true,
    });
    if (
      coupon &&
      (!coupon.validTo || coupon.validTo > new Date()) &&
      totalsPreCoupon.subtotal >= coupon.minOrderAmount &&
      (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)
    ) {
      discountAmount =
        coupon.discountType === "percentage"
          ? (totalsPreCoupon.subtotal * coupon.discountValue) / 100
          : coupon.discountValue;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
      coupon.usedCount += 1;
      await coupon.save();
      appliedCoupon = coupon.code;
    }
  }

  const totals = calculateOrderTotals(orderItems, { discountAmount });

  const order = await Order.create({
    branch: table.branch,
    table: table._id,
    sessionId: sessionId || table.currentSessionId,
    customer: req.user?._id,
    guestName,
    items: orderItems,
    ...totals,
    couponCode: appliedCoupon,
    notes,
    status: ORDER_STATUS.PLACED,
    statusHistory: [{ status: ORDER_STATUS.PLACED, changedBy: req.user?._id }],
  });

  // Update table status to "ordering"
  table.status = TABLE_STATUS.ORDERING;
  await table.save();

  const populatedOrder = await order.populate("table", "tableNumber");

  // Notify kitchen dashboard in real time
  emitToRole(table.branch, "kitchen", SOCKET_EVENTS.NEW_ORDER, populatedOrder);
  emitToRole(table.branch, "waiter", SOCKET_EVENTS.NEW_ORDER, populatedOrder);
  emitToBranch(table.branch, SOCKET_EVENTS.NEW_ORDER, populatedOrder);

  res.status(201).json({ success: true, order: populatedOrder });
});

// @desc    Get orders (filterable by branch, table, session, status)
// @route   GET /api/orders?branch=&table=&sessionId=&status=
// @access  Private/Staff or Public (with sessionId+table, for customer order tracking)
const getOrders = asyncHandler(async (req, res) => {
  const { branch, table, sessionId, status } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (table) filter.table = table;
  if (sessionId) filter.sessionId = sessionId;
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate("table", "tableNumber")
    .populate("customer", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: orders.length, orders });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private/Staff or Public (session-scoped tracking)
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("table", "tableNumber")
    .populate("customer", "name");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json({ success: true, order });
});

// @desc    Update order status (kitchen/waiter workflow: accepted -> preparing -> ready -> served)
// @route   PATCH /api/orders/:id/status
// @access  Private/Kitchen,Waiter,Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Object.values(ORDER_STATUS).includes(status)) {
    res.status(400);
    throw new Error("Invalid order status");
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;
  order.statusHistory.push({ status, changedBy: req.user?._id });
  await order.save();

  const payload = { orderId: order._id, status: order.status, tableId: order.table };

  // Notify the specific table session (customer live tracking) and staff dashboards
  emitToTable(order.table, order.sessionId, SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
  emitToBranch(order.branch, SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);

  res.json({ success: true, order });
});

// @desc    Flag/unflag an order as urgent (kitchen delay flagging)
// @route   PATCH /api/orders/:id/urgent
// @access  Private/Kitchen,Admin
const setUrgent = asyncHandler(async (req, res) => {
  const { isUrgent } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { isUrgent },
    { new: true }
  );
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json({ success: true, order });
});

// @desc    Cancel an order
// @route   PATCH /api/orders/:id/cancel
// @access  Private/Staff or Customer (own order, if still placed)
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.status !== ORDER_STATUS.PLACED) {
    res.status(400);
    throw new Error("Only orders that have not yet been accepted can be cancelled");
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.statusHistory.push({ status: ORDER_STATUS.CANCELLED, changedBy: req.user?._id });
  await order.save();

  emitToBranch(order.branch, SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
    orderId: order._id,
    status: order.status,
  });

  res.json({ success: true, order });
});

module.exports = {
  placeOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  setUrgent,
  cancelOrder,
};
