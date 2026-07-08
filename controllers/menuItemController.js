const asyncHandler = require("express-async-handler");
const MenuItem = require("../models/MenuItem");
const { SOCKET_EVENTS } = require("../config/constants");
const { emitToBranch } = require("../sockets");

// @desc    Create a menu item
// @route   POST /api/menu/items
// @access  Private/Admin
const createItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(req.body);
  res.status(201).json({ success: true, item });
});

// @desc    Get menu items with search/filter (branch, category, veg, tags, price range, search text)
// @route   GET /api/menu/items?branch=&category=&isVeg=&tags=&minPrice=&maxPrice=&search=
// @access  Public
const getItems = asyncHandler(async (req, res) => {
  const { branch, category, isVeg, tags, minPrice, maxPrice, search } = req.query;
  const filter = { isActive: true };

  if (branch) filter.branch = branch;
  if (category) filter.category = category;
  if (isVeg !== undefined) filter.isVeg = isVeg === "true";
  if (tags) filter.tags = { $in: tags.split(",") };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const items = await MenuItem.find(filter).populate("category", "name displayOrder");
  res.json({ success: true, count: items.length, items });
});

// @desc    Get a single menu item
// @route   GET /api/menu/items/:id
// @access  Public
const getItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate("category", "name");
  if (!item) {
    res.status(404);
    throw new Error("Menu item not found");
  }
  res.json({ success: true, item });
});

// @desc    Update a menu item
// @route   PUT /api/menu/items/:id
// @access  Private/Admin
const updateItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) {
    res.status(404);
    throw new Error("Menu item not found");
  }
  res.json({ success: true, item });
});

// @desc    Toggle item availability (86'd / back in stock) - Kitchen role
// @route   PATCH /api/menu/items/:id/availability
// @access  Private/Kitchen,Admin
const toggleAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Menu item not found");
  }

  item.isAvailable = isAvailable;
  await item.save();

  // Reflect instantly on customer-facing menu
  emitToBranch(item.branch, SOCKET_EVENTS.ITEM_AVAILABILITY_UPDATED, {
    itemId: item._id,
    isAvailable: item.isAvailable,
  });

  res.json({ success: true, item });
});

// @desc    Delete (deactivate) a menu item
// @route   DELETE /api/menu/items/:id
// @access  Private/Admin
const deleteItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!item) {
    res.status(404);
    throw new Error("Menu item not found");
  }
  res.json({ success: true, message: "Menu item deactivated" });
});

module.exports = {
  createItem,
  getItems,
  getItem,
  updateItem,
  toggleAvailability,
  deleteItem,
};
