const express = require("express");
const router = express.Router();
const { createStaff, getStaff, updateStaff, deleteStaff } = require("../controllers/staffController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

router.use(protect, authorize(ROLES.ADMIN));

router.route("/").post(createStaff).get(getStaff);
router.route("/:id").put(updateStaff).delete(deleteStaff);

module.exports = router;
