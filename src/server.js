require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const { initDatabase, getConnection } = require("./database/connection");
const { ensureSchema } = require("./database/bootstrap");
const { config } = require("./config");

async function startServer() {
  // 1) DB init
  const db = await initDatabase();

  // 2) Ensure schema exists (idempotent)
  await ensureSchema(db);

  // 3) App init
  const app = express();

  // Middleware
  app.set("trust proxy", true);
  app.use(cors(config.cors));
  app.use(express.json());
  app.use(morgan(config.env === "production" ? "combined" : "dev"));

  // Static frontend
  const frontendPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendPath));

  // API routes
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/roles", require("./routes/roles"));
  app.use("/api/permissions", require("./routes/permissions"));
  app.use("/api/resource", require("./routes/resource"));
  app.use("/api/audit", require("./routes/audit"));
  app.use("/api/firewall", require("./routes/firewall"));
  app.use("/api/engine", require("./routes/engine"));

  // Health
  app.get("/api/health", async (req, res) => {
    const db = getConnection();
    const userCount = await db.prepare("SELECT COUNT(*) as count FROM users").get();
    const tenantCount = await db.prepare("SELECT COUNT(*) as count FROM tenants").get();
    const auditCount = await db.prepare("SELECT COUNT(*) as count FROM audit_log").get();

    res.json({
      status: "operational",
      service: "SecureIT Authorization Engine",
      version: "1.0.0",
      uptime: process.uptime(),
      database: {
        users: userCount.count,
        tenants: tenantCount.count,
        auditEntries: auditCount.count,
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/my-ip", async (req, res) => {
    res.json({ ip: req.ip || req.connection.remoteAddress });
  });

  // API 404
  app.all("/api/*", async (req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "API endpoint not found." });
  });

  // SPA catch-all
  app.get("*", async (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("🔥 Error:", err);
    const message = config.env === "production" ? "Internal Server Error" : err.message;
    res.status(500).json({ error: "INTERNAL_ERROR", message });
  });

  // Listen
  app.listen(config.port, config.host, () => {
    console.log("Permission Escalation Firewall");
    console.log(`Server: http://${config.host}:${config.port}`);
    console.log(`Health: http://${config.host}:${config.port}/api/health`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});