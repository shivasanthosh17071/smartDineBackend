const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { ROLES } = require("../config/constants");

// @desc    Create a staff account (kitchen, waiter, cashier, admin)
// @route   POST /api/staff
// @access  Private/Admin
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, branch } = req.body;

  if (!Object.values(ROLES).includes(role) || role === ROLES.CUSTOMER) {
    res.status(400);
    throw new Error("Invalid staff role");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const staff = await User.create({ name, email, password, phone, role, branch });
  res.status(201).json({ success: true, staff: staff.toSafeObject() });
});

// @desc    Get all staff (optionally filtered by branch/role)
// @route   GET /api/staff?branch=&role=
// @access  Private/Admin
const getStaff = asyncHandler(async (req, res) => {
  const filter = { role: { $ne: ROLES.CUSTOMER } };
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.role) filter.role = req.query.role;

  const staff = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: staff.length, staff: staff.map((s) => s.toSafeObject()) });
});

// @desc    Update a staff member (role, branch, active status)
// @route   PUT /api/staff/:id
// @access  Private/Admin
const updateStaff = asyncHandler(async (req, res) => {
  const { name, phone, role, branch, isActive } = req.body;
  const staff = await User.findById(req.params.id);
  if (!staff || staff.role === ROLES.CUSTOMER) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  if (name) staff.name = name;
  if (phone) staff.phone = phone;
  if (role) staff.role = role;
  if (branch) staff.branch = branch;
  if (isActive !== undefined) staff.isActive = isActive;

  await staff.save();
  res.json({ success: true, staff: staff.toSafeObject() });
});

// @desc    Deactivate a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }
  res.json({ success: true, message: "Staff account deactivated" });
});

module.exports = { createStaff, getStaff, updateStaff, deleteStaff };
