const mongoose = require("mongoose");
const { TABLE_STATUS } = require("../config/constants");

const tableSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    tableNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 4 },
    qrToken: { type: String, required: true, unique: true },
    qrCodeImage: { type: String }, // base64 data URL
    status: {
      type: String,
      enum: Object.values(TABLE_STATUS),
      default: TABLE_STATUS.AVAILABLE,
    },
    currentSessionId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tableSchema.index({ branch: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);
