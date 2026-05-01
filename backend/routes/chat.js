/**
 * File: routes/chat.js
 * Description: POST /api/chat - authenticated Gemini-backed chat endpoint.
 *
 *   1. Validate input
 *   2. Enforce auth and request pacing
 *   3. Generate a reply through the configured AI provider
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/requireAuth");
const { getModelStatus, getResponse } = require("../services/mlService");

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AgriBot is busy right now. Please wait a moment and try again.",
  },
});

router.post("/chat", requireAuth, chatLimiter, async (request, response) => {
  const { message } = request.body ?? {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return response.status(400).json({ error: "Message is required." });
  }

  if (message.length > 500) {
    return response
      .status(400)
      .json({ error: "Message too long. Use 500 characters or fewer." });
  }

  const query = message.trim();

  try {
    const reply = await getResponse(query);
    return response.status(200).json({ response: reply });
  } catch (error) {
    const modelStatus = getModelStatus();
    console.error("[/api/chat] AI provider error:", error);

    if (error.code === "MODEL_ERROR") {
      return response.status(503).json({
        error:
          "AgriBot is unavailable because the AI provider is not configured correctly.",
        modelStatus,
      });
    }

    if (error.code === "MODEL_RATE_LIMIT") {
      return response.status(429).json({
        error: "AgriBot is busy right now. Please wait a moment and try again.",
        modelStatus,
      });
    }

    if (error.code === "MODEL_TIMEOUT") {
      return response.status(504).json({
        error: "AgriBot took too long to respond. Please try again.",
        modelStatus,
      });
    }

    return response.status(500).json({
      error: "AgriBot could not generate a reply right now.",
      modelStatus,
    });
  }
});

module.exports = router;
