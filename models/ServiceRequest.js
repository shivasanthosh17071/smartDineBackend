const mongoose = require("mongoose");
const {
  SERVICE_REQUEST_TYPE,
  SERVICE_REQUEST_STATUS,
} = require("../config/constants");

const serviceRequestSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    sessionId: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(SERVICE_REQUEST_TYPE),
      required: true,
    },
    note: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(SERVICE_REQUEST_STATUS),
      default: SERVICE_REQUEST_STATUS.PENDING,
    },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
