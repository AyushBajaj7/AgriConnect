/**
 * File: routes/chat.js
 * Description: POST /api/chat — full RAG pipeline.
 *
 *   1. Validate input (message string, history must be array)
 *   2. Retrieve relevant knowledge chunks (RAG)
 *   3. Generate context-augmented response via Gemini
 *   4. Return JSON { response, ragReady }
 *
 * Pipeline: message → retrieveContext() → generateResponse(msg, history, ctx) → JSON
 */

const express = require('express');
const router  = express.Router();

const { generateResponse } = require('../services/geminiService');
const { retrieveContext, isReady } = require('../services/ragService');

/**
 * POST /api/chat
 * Body: { message: string, history?: Array<{ role, text }> }
 * Response: { response: string, ragReady: boolean }
 */
router.post('/chat', async (req, res) => {
  const { message } = req.body;

  // ── Input validation ───────────────────────────────────────────────────────
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
  }

  // Guard: history must be an array — malformed payloads (string/object) would
  // crash sanitizeHistory() in geminiService without this check.
  const history = Array.isArray(req.body.history) ? req.body.history : [];
  const query   = message.trim();

  try {
    // ── Step 1: RAG retrieval ────────────────────────────────────────────────
    const context = isReady() ? await retrieveContext(query, 3) : '';

    if (context) {
      console.log(`[RAG] ${context.split('[Knowledge').length - 1} chunk(s) for: "${query.slice(0, 60)}"`);
    }

    // ── Step 2: Generate response with context ───────────────────────────────
    const response = await generateResponse(query, history, context);

    return res.status(200).json({ response, ragReady: isReady() });

  } catch (error) {
    console.error('[/api/chat] Error:', error?.message ?? error);

    if (error?.status === 429 || error?.message?.includes('429')) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait 30 seconds.' });
    }
    return res.status(500).json({ error: 'Failed to generate response. Please try again.' });
  }
});

module.exports = router;
