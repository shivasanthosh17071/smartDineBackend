require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets");
const User = require("./models/User");
const { ROLES } = require("./config/constants");

const PORT = process.env.PORT || 5000;

const bootstrapAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Super Admin";

    if (!email || !password) return;

    const existingAdmin = await User.findOne({ email });
    if (!existingAdmin) {
      await User.create({ name, email, password, role: ROLES.ADMIN });
      console.log(`👤 Bootstrap admin account created: ${email}`);
    }
  } catch (error) {
    console.error("⚠️  Failed to bootstrap admin account:", error.message);
  }
};

const startServer = async () => {
  await connectDB();
  await bootstrapAdmin();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 SmartDine API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
};

startServer();

// Graceful handling of unexpected errors
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
});
