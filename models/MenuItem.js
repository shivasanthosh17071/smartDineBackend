const mongoose = require("mongoose");

const addOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "MenuCategory", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String }, // Cloudinary URL
    isVeg: { type: Boolean, default: true },
    tags: [{ type: String }], // vegan, gluten-free, bestseller, etc.
    allergens: [{ type: String }],
    spiceLevels: [{ type: String }], // e.g. ["Mild", "Medium", "Hot"]
    portionSizes: [{ type: String }], // e.g. ["Half", "Full"]
    addOns: [addOnSchema],
    prepTimeMinutes: { type: Number, default: 15 },
    isAvailable: { type: Boolean, default: true }, // kitchen "86" toggle
    stockCount: { type: Number, default: null }, // null = unlimited
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

menuItemSchema.index({ branch: 1, category: 1 });
menuItemSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("MenuItem", menuItemSchema);
