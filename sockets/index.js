const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Clients join rooms based on branch and/or role so events only
    // reach the relevant dashboards (kitchen, waiter, cashier, admin)
    // and the specific customer table session.
    socket.on("join:branch", (branchId) => {
      socket.join(`branch:${branchId}`);
    });

    socket.on("join:role", ({ branchId, role }) => {
      socket.join(`branch:${branchId}:role:${role}`);
    });

    socket.on("join:table", ({ tableId, sessionId }) => {
      socket.join(`table:${tableId}:${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized. Call initSocket first.");
  return io;
};

// Convenience emitters used across controllers
const emitToBranch = (branchId, event, payload) => {
  getIO().to(`branch:${branchId}`).emit(event, payload);
};

const emitToRole = (branchId, role, event, payload) => {
  getIO().to(`branch:${branchId}:role:${role}`).emit(event, payload);
};

const emitToTable = (tableId, sessionId, event, payload) => {
  getIO().to(`table:${tableId}:${sessionId}`).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToBranch, emitToRole, emitToTable };
