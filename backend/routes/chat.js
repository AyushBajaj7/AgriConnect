/**
 * File: routes/chat.js
 * Description: POST /api/chat — custom NLP chat pipeline.
 *
 *   1. Validate input (message string)
 *   2. Classify and reply via local ML model
 */

const express = require("express");
const router = express.Router();
const { getResponse } = require("../services/mlService");

/**
 * POST /api/chat
 * Body: { message: string, history?: Array }
 * Response: { response: string }
 */
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }
  if (message.length > 500) {
    return res
      .status(400)
      .json({ error: "Message too long (max 500 characters)" });
  }

  const query = message.trim();

  try {
    // Inference via local Generative AI
    const reply = await getResponse(query);
    return res.status(200).json({ response: reply });
  } catch (error) {
    console.error("[/api/chat] NLP Error:", error);
    return res.status(500).json({ error: "Failed to classify phrase." });
  }
});

module.exports = router;
