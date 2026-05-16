require("dotenv").config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { createFirewall } = require("./middleware/firewall");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const priceRoutes = require("./routes/prices");
const schemeRoutes = require("./routes/schemes");
const { getAuthStatus } = require("./services/authService");
const { initML, getModelStatus } = require("./services/mlService");
const { getPriceStatus } = require("./services/priceService");

const app = express();
const PORT = process.env.PORT ?? 5000;
let backendInitialized = false;
const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
  ...configuredOrigins,
]);

function isLocalDevelopmentOrigin(origin) {
  if (!origin) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return (
      (protocol === "http:" || protocol === "https:") &&
      (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")
    );
  } catch {
    return false;
  }
}

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST"],
  }),
);
app.use(cookieParser());
app.use(createFirewall());
app.use(express.json({ limit: "10kb" }));

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", priceRoutes);
app.use("/api", schemeRoutes);

function sendHealthStatus(_request, response) {
  const ai = getModelStatus();
  const status = ai.state === "ready" ? "ok" : "degraded";

  response.json({
    status,
    service: "AgriConnect Backend",
    auth: getAuthStatus(),
    ai,
    prices: getPriceStatus(),
  });
}

app.get("/health", sendHealthStatus);
app.get("/api/health", sendHealthStatus);

function initializeBackend() {
  if (backendInitialized) {
    return;
  }

  initML();
  backendInitialized = true;
}

function startServer() {
  try {
    initializeBackend();

    const server = app.listen(PORT, () => {
      console.log(`AgriConnect backend running on http://localhost:${PORT}`);
      console.log(`POST http://localhost:${PORT}/api/chat`);
      console.log(`POST http://localhost:${PORT}/api/auth/login`);
    });

    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Another AgriConnect backend instance is already running on http://localhost:${PORT}.`,
        );
        process.exit(1);
      }

      console.error("Failed to start server:", error);
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

initializeBackend();

module.exports = { app, initializeBackend, startServer };
