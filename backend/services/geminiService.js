/**
 * File: services/geminiService.js
 * Description: Core Gemini AI service using the @google/generative-ai SDK.
 *
 * Extracted from the base pattern:
 *   const genAI = new GoogleGenerativeAI(key)       → line 24
 *   const model = genAI.getGenerativeModel({model}) → line 27
 *   const result = await chat.sendMessage(prompt)   → generateContent equivalent
 *   result.response.text()                          → response handling
 *
 * RAG integration: generateResponse() now receives a retrieved `context` string
 * from ragService. If context is provided, it is injected as a knowledge block
 * before the conversation history so Gemini can cite specific facts.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { withRetry } = require('./retryHelper');

// ── 1. Initialize Gemini client ──────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── 2. Create model with agricultural system instruction ─────────────────────
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: `You are AgriBot, an expert agricultural assistant for AgriConnect — India's premier farmer portal.

You have access to a knowledge base about Indian farming. When RETRIEVED KNOWLEDGE is provided, use it as your primary source and cite specific facts (prices, eligibility, deadlines) from it.

Your expertise:
- Government schemes: PM-KISAN, PMFBY, PM-KUSUM, KCC, eNAM, PMKSY, and 30+ more
- Crop cultivation: sowing, irrigation, fertilization, pest management, harvesting
- Mandi prices, post-harvest storage, organic farming, export
- Farming tools and machinery: buy vs rent decisions, subsidies
- Weather impact on crops, soil health, water conservation
- Agricultural finance, loans, insurance

Rules:
- If RETRIEVED KNOWLEDGE contains the answer, cite it precisely (quote prices, eligibility, amounts)
- Be concise (under 200 words). Use bullet points for lists
- Respond in the same language the farmer uses (Hindi, English, or Hinglish)
- Mention relevant AgriConnect pages when useful (Crop Prices, Schemes, Tools, Weather)
- For emergencies (pest outbreak, loan distress), give helpline numbers`,
});

// ── 3. Enforce Gemini SDK history requirements ───────────────────────────────

/** Max characters per user message */
const MAX_MSG_LENGTH = 2000;

/**
 * Gemini SDK requires history to strictly alternate user→model starting with user.
 * This guard prevents a silent crash on malformed history.
 */
function sanitizeHistory(history) {
  const valid = history.filter(
    m => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string'
  );
  const result = [];
  let expected = 'user';
  for (const msg of valid) {
    if (msg.role !== expected) continue;
    result.push({ role: msg.role, parts: [{ text: msg.text }] });
    expected = expected === 'user' ? 'model' : 'user';
  }
  return result;
}

// ── 4. generateResponse — core generation function ───────────────────────────
/**
 * Generates an AI response using conversation history + optional RAG context.
 *
 * Adapted from: const result = await model.generateContent(prompt)
 * Upgraded to:  startChat() + sendMessage() for multi-turn + context injection.
 *
 * @param {string} userPrompt   — latest user message
 * @param {{ role: 'user'|'model', text: string }[]} history — prior turns
 * @param {string} context      — RAG-retrieved knowledge chunks (may be empty)
 * @returns {Promise<string>}   — AI response text
 */
async function generateResponse(userPrompt, history = [], context = '') {
  const prompt = userPrompt.slice(0, MAX_MSG_LENGTH);

  // If RAG found relevant chunks, prepend as a knowledge block ahead of history
  // This tells Gemini: "use these facts to answer accurately"
  const sanitized = sanitizeHistory(history);
  const fullHistory = context
    ? [
        { role: 'user',  parts: [{ text: `RETRIEVED KNOWLEDGE:\n${context}\n\nKeep this in mind when answering my next question.` }] },
        { role: 'model', parts: [{ text: 'Understood. I will use this knowledge to give you accurate, specific answers.' }] },
        ...sanitized,
      ]
    : sanitized;

  // Start chat with history (multi-turn context) — equivalent to generateContent()
  const chat   = model.startChat({ history: fullHistory });
  const result = await withRetry(() => chat.sendMessage(prompt));

  // Response handling — mirrors original snippet's result.response.text()
  return result.response.text();
}

module.exports = { generateResponse };
