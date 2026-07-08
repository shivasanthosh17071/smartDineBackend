const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { generateToken, setTokenCookie } = require("../utils/generateToken");
const { ROLES } = require("../config/constants");

// @desc    Register a new user (customer by default, staff via admin-created accounts)
// @route   POST /api/auth/register
// @access  Public (for customers) - staff accounts should be created by admin via /api/admin/staff
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: ROLES.CUSTOMER,
  });

  const token = generateToken(user._id, user.role);
  setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Login (customer or staff)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id, user.role);
  setTokenCookie(res, token);

  res.json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update own profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Logout - clears auth cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = { register, login, getMe, updateMe, logout };
