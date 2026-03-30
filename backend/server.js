/**
 * File: server.js
 * Description: AgriConnect backend entry point.
 *              Initializes NLP classifier on startup, then mounts routes.
 *
 * Startup sequence:
 *   1. Load .env
 *   2. initML() — initialize NLP engine
 *   3. Start listening on PORT (default 5000)
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const chatRoutes = require("./routes/chat");
const { initML } = require("./services/mlService");

const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3003"],
    methods: ["POST", "GET"],
  }),
);
app.use(express.json({ limit: "10kb" }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", chatRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "AgriConnect Custom NLP Backend" });
});

// ── Boot: Initialize ML ───────────────────────────
function startServer() {
  try {
    initML();

    app.listen(PORT, () => {
      console.log(`✅ AgriConnect backend running on http://localhost:${PORT}`);
      console.log(`   POST http://localhost:${PORT}/api/chat`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// Start server normally
startServer();
