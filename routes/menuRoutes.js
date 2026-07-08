const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/menuCategoryController");
const {
  createItem,
  getItems,
  getItem,
  updateItem,
  toggleAvailability,
  deleteItem,
} = require("../controllers/menuItemController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

// Categories - public read, admin write
router.get("/categories", getCategories);
router.post("/categories", protect, authorize(ROLES.ADMIN), createCategory);
router.put("/categories/:id", protect, authorize(ROLES.ADMIN), updateCategory);
router.delete("/categories/:id", protect, authorize(ROLES.ADMIN), deleteCategory);

// Items - public read, admin write, kitchen availability toggle
router.get("/items", getItems);
router.get("/items/:id", getItem);
router.post("/items", protect, authorize(ROLES.ADMIN), createItem);
router.put("/items/:id", protect, authorize(ROLES.ADMIN), updateItem);
router.patch(
  "/items/:id/availability",
  protect,
  authorize(ROLES.ADMIN, ROLES.KITCHEN),
  toggleAvailability
);
router.delete("/items/:id", protect, authorize(ROLES.ADMIN), deleteItem);

module.exports = router;
