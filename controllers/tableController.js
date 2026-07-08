const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const Table = require("../models/Table");
const { generateTableQR } = require("../utils/qrGenerator");
const { TABLE_STATUS, SOCKET_EVENTS } = require("../config/constants");
const { emitToBranch } = require("../sockets");

// @desc    Create a new table with auto-generated QR code
// @route   POST /api/tables
// @access  Private/Admin
const createTable = asyncHandler(async (req, res) => {
  const { branch, tableNumber, capacity } = req.body;

  // Create the table first to get its ID, then generate QR pointing at it
  const table = await Table.create({
    branch,
    tableNumber,
    capacity,
    qrToken: uuidv4(), // temp, replaced below
  });

  const { qrToken, qrCodeImage } = await generateTableQR(table._id.toString());
  table.qrToken = qrToken;
  table.qrCodeImage = qrCodeImage;
  await table.save();

  res.status(201).json({ success: true, table });
});

// @desc    Get all tables for a branch
// @route   GET /api/tables?branch=<id>
// @access  Private/Staff
const getTables = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.branch) filter.branch = req.query.branch;

  const tables = await Table.find(filter).populate("branch", "name city");
  res.json({ success: true, count: tables.length, tables });
});

// @desc    Get single table by ID
// @route   GET /api/tables/:id
// @access  Private/Staff
const getTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id).populate("branch", "name city");
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }
  res.json({ success: true, table });
});

// @desc    Resolve a table + start/resume a dining session via QR token (customer scans QR)
// @route   GET /api/tables/qr/:qrToken
// @access  Public
const resolveQRToken = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ qrToken: req.params.qrToken, isActive: true }).populate(
    "branch",
    "name city address"
  );

  if (!table) {
    res.status(404);
    throw new Error("Invalid or expired QR code");
  }

  // Start a new session if the table is currently available (unoccupied)
  if (!table.currentSessionId || table.status === TABLE_STATUS.AVAILABLE) {
    table.currentSessionId = uuidv4();
    table.status = TABLE_STATUS.SEATED;
    await table.save();
    emitToBranch(table.branch._id, SOCKET_EVENTS.TABLE_STATUS_UPDATED, {
      tableId: table._id,
      status: table.status,
    });
  }

  res.json({
    success: true,
    table: {
      id: table._id,
      tableNumber: table.tableNumber,
      branch: table.branch,
      sessionId: table.currentSessionId,
      status: table.status,
    },
  });
});

// @desc    Update table status (used by waiter dashboard)
// @route   PATCH /api/tables/:id/status
// @access  Private/Staff
const updateTableStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }

  table.status = status;
  if (status === TABLE_STATUS.AVAILABLE) {
    table.currentSessionId = null; // end session, ready for new guests
  }
  await table.save();

  emitToBranch(table.branch, SOCKET_EVENTS.TABLE_STATUS_UPDATED, {
    tableId: table._id,
    status: table.status,
  });

  res.json({ success: true, table });
});

// @desc    Regenerate a table's QR code (e.g. if compromised)
// @route   POST /api/tables/:id/regenerate-qr
// @access  Private/Admin
const regenerateQR = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }
  const { qrToken, qrCodeImage } = await generateTableQR(table._id.toString());
  table.qrToken = qrToken;
  table.qrCodeImage = qrCodeImage;
  await table.save();
  res.json({ success: true, table });
});

// @desc    Delete (deactivate) a table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }
  res.json({ success: true, message: "Table deactivated" });
});

module.exports = {
  createTable,
  getTables,
  getTable,
  resolveQRToken,
  updateTableStatus,
  regenerateQR,
  deleteTable,
};
