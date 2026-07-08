const asyncHandler = require("express-async-handler");
const ServiceRequest = require("../models/ServiceRequest");
const Table = require("../models/Table");
const { SERVICE_REQUEST_STATUS, SOCKET_EVENTS, TABLE_STATUS } = require("../config/constants");
const { emitToRole, emitToBranch } = require("../sockets");

// @desc    Create a one-tap service request (water, cutlery, bill, waiter call, etc.)
// @route   POST /api/service-requests
// @access  Public
const createServiceRequest = asyncHandler(async (req, res) => {
  const { tableId, sessionId, type, note } = req.body;

  const table = await Table.findById(tableId);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }

  const serviceRequest = await ServiceRequest.create({
    branch: table.branch,
    table: tableId,
    sessionId,
    type,
    note,
  });

  if (type === "bill") {
    table.status = TABLE_STATUS.NEEDS_BILL;
  } else if (type === "waiter_call") {
    table.status = TABLE_STATUS.NEEDS_ASSISTANCE;
  }
  await table.save();

  const payload = await serviceRequest.populate("table", "tableNumber");

  emitToRole(table.branch, "waiter", SOCKET_EVENTS.SERVICE_REQUEST_NEW, payload);
  emitToBranch(table.branch, SOCKET_EVENTS.TABLE_STATUS_UPDATED, {
    tableId: table._id,
    status: table.status,
  });

  res.status(201).json({ success: true, serviceRequest: payload });
});

// @desc    Get service requests (filterable)
// @route   GET /api/service-requests?branch=&status=&table=
// @access  Private/Waiter,Admin
const getServiceRequests = asyncHandler(async (req, res) => {
  const { branch, status, table } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (status) filter.status = status;
  if (table) filter.table = table;

  const requests = await ServiceRequest.find(filter)
    .populate("table", "tableNumber")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: requests.length, requests });
});

// @desc    Acknowledge or resolve a service request
// @route   PATCH /api/service-requests/:id/status
// @access  Private/Waiter,Admin
const updateServiceRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Service request not found");
  }

  request.status = status;
  if (status === SERVICE_REQUEST_STATUS.ACKNOWLEDGED) request.acknowledgedBy = req.user?._id;
  if (status === SERVICE_REQUEST_STATUS.RESOLVED) request.resolvedAt = new Date();
  await request.save();

  emitToBranch(request.branch, SOCKET_EVENTS.SERVICE_REQUEST_UPDATED, {
    requestId: request._id,
    status: request.status,
  });

  res.json({ success: true, serviceRequest: request });
});

module.exports = { createServiceRequest, getServiceRequests, updateServiceRequestStatus };
