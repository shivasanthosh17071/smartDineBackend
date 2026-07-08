const mongoose = require("mongoose");

const menuCategorySchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    availableFrom: { type: String }, // e.g. "07:00"
    availableTo: { type: String }, // e.g. "11:00" (for breakfast vs dinner menus)
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuCategory", menuCategorySchema);
