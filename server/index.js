// ============================================
// Nexus Compliance AI – Express.js Backend Server
// ============================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { PORT } = require("./config/keys");

const app = express();

// ---- Security Middleware ----
app.use(helmet());
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, error: "Too many requests. Try again later." } });
app.use("/api/", limiter);

// AI routes get stricter limits
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, error: "AI rate limit reached. Wait a minute." } });
app.use("/api/ai", aiLimiter);

// ---- Routes ----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/calendar", require("./routes/calendar"));
app.use("/api/compliance", require("./routes/compliance"));
app.use("/api/risk", require("./routes/risk"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/integrations", require("./routes/integrations"));
app.use("/api/news", require("./routes/news"));
app.use("/api/ai", require("./routes/aiAssistant"));
app.use("/api/settings", require("./routes/settings"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", uptime: process.uptime() } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ success: false, error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`✅ Nexus Compliance Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
