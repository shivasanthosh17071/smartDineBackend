const express = require("express");
const router = express.Router();
const {
  createTable,
  getTables,
  getTable,
  resolveQRToken,
  updateTableStatus,
  regenerateQR,
  deleteTable,
} = require("../controllers/tableController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

// Public - customer scans QR code
router.get("/qr/:qrToken", resolveQRToken);

// Staff/Admin protected routes
router.post("/", protect, authorize(ROLES.ADMIN), createTable);
router.get("/", protect, authorize(ROLES.ADMIN, ROLES.WAITER, ROLES.CASHIER, ROLES.KITCHEN), getTables);
router.get("/:id", protect, authorize(ROLES.ADMIN, ROLES.WAITER, ROLES.CASHIER, ROLES.KITCHEN), getTable);
router.patch("/:id/status", protect, authorize(ROLES.ADMIN, ROLES.WAITER), updateTableStatus);
router.post("/:id/regenerate-qr", protect, authorize(ROLES.ADMIN), regenerateQR);
router.delete("/:id", protect, authorize(ROLES.ADMIN), deleteTable);

module.exports = router;
