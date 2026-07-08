const asyncHandler = require("express-async-handler");
const Branch = require("../models/Branch");

// @desc    Create a new branch
// @route   POST /api/branches
// @access  Private/Admin
const createBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json({ success: true, branch });
});

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private/Admin
const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find().sort({ createdAt: -1 });
  res.json({ success: true, count: branches.length, branches });
});

// @desc    Get a single branch
// @route   GET /api/branches/:id
// @access  Private/Admin
const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    res.status(404);
    throw new Error("Branch not found");
  }
  res.json({ success: true, branch });
});

// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Private/Admin
const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!branch) {
    res.status(404);
    throw new Error("Branch not found");
  }
  res.json({ success: true, branch });
});

// @desc    Delete (deactivate) a branch
// @route   DELETE /api/branches/:id
// @access  Private/Admin
const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!branch) {
    res.status(404);
    throw new Error("Branch not found");
  }
  res.json({ success: true, message: "Branch deactivated", branch });
});

module.exports = { createBranch, getBranches, getBranch, updateBranch, deleteBranch };
