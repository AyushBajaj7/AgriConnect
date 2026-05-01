require("dotenv").config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const { getAuthStatus } = require("./services/authService");
const { initML, getModelStatus } = require("./services/mlService");

const app = express();
const PORT = process.env.PORT ?? 5000;
const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3003",
  ...configuredOrigins,
]);

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
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
app.use(express.json({ limit: "10kb" }));

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// Proxy for Agmarknet price API (avoids CORS in browser)
app.get("/api/prices", async (_req, res) => {
  const AGMARKNET_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aeb08d72d1860f33d1";
  const AGMARKNET_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
  try {
    const apiUrl = `${AGMARKNET_URL}?api-key=${AGMARKNET_KEY}&format=json&limit=80`;
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Upstream API unavailable", message: err.message });
  }
});

app.get("/health", (_request, response) => {
  const ai = getModelStatus();
  const status = ai.state === "ready" ? "ok" : "degraded";

  response.json({
    status,
    service: "AgriConnect Backend",
    auth: getAuthStatus(),
    ai,
  });
});

function startServer() {
  try {
    initML();

    return app.listen(PORT, () => {
      console.log(`AgriConnect backend running on http://localhost:${PORT}`);
      console.log(`POST http://localhost:${PORT}/api/chat`);
      console.log(`POST http://localhost:${PORT}/api/auth/login`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
