const asyncHandler = require("express-async-handler");
const MenuCategory = require("../models/MenuCategory");

// @desc    Create a menu category
// @route   POST /api/menu/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.create(req.body);
  res.status(201).json({ success: true, category });
});

// @desc    Get all categories for a branch
// @route   GET /api/menu/categories?branch=<id>
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.branch) filter.branch = req.query.branch;

  const categories = await MenuCategory.find(filter).sort({ displayOrder: 1, name: 1 });
  res.json({ success: true, count: categories.length, categories });
});

// @desc    Update a category
// @route   PUT /api/menu/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, category });
});

// @desc    Delete (deactivate) a category
// @route   DELETE /api/menu/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, message: "Category deactivated" });
});

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
