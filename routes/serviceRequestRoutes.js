const express = require("express");
const router = express.Router();
const {
  createServiceRequest,
  getServiceRequests,
  updateServiceRequestStatus,
} = require("../controllers/serviceRequestController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

router.post("/", createServiceRequest); // public - customer taps a service button
router.get("/", protect, authorize(ROLES.ADMIN, ROLES.WAITER), getServiceRequests);
router.patch(
  "/:id/status",
  protect,
  authorize(ROLES.ADMIN, ROLES.WAITER),
  updateServiceRequestStatus
);

module.exports = router;
