const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  setUrgent,
  cancelOrder,
} = require("../controllers/orderController");
const { optionalAuth, protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

// Customer (guest or logged-in) places an order
router.post("/", optionalAuth, placeOrder);

// Orders can be viewed by staff (all) or customers tracking their own session (public, scoped by sessionId+table)
router.get("/", optionalAuth, getOrders);
router.get("/:id", optionalAuth, getOrder);

router.patch(
  "/:id/status",
  protect,
  authorize(ROLES.ADMIN, ROLES.KITCHEN, ROLES.WAITER),
  updateOrderStatus
);
router.patch("/:id/urgent", protect, authorize(ROLES.ADMIN, ROLES.KITCHEN), setUrgent);
router.patch("/:id/cancel", optionalAuth, cancelOrder);

module.exports = router;
