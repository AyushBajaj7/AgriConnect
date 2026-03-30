/**
 * File: chatService.js
 * Description: Frontend chat service. Sends user messages and conversation
 *              history to the AgriConnect Express backend, which calls the
 *              Gemini API server-side (API key never exposed to browser).
 *
 * Architecture:
 *   Browser (React) → POST /api/chat → backend/server.js
 *                                    → backend/routes/chat.js
 *                                    → backend/services/geminiService.js
 *                                    → Google Gemini API
 *
 * Used in: components/Chatbot/Chatbot.js
 */

/** Backend base URL — set REACT_APP_BACKEND_URL in .env for production */
const BACKEND_URL =
  (process.env.REACT_APP_BACKEND_URL ?? "http://localhost:5000") + "/api/chat";

/**
 * Sends a user message to the backend and returns the AI response text.
 * The backend handles Gemini API calls using the @google/generative-ai SDK.
 *
 * @param {{ role: 'user'|'model', text: string }[]} history - Prior messages
 * @param {string} userMessage - The new user message
 * @returns {Promise<string>} The AI response text
 */
export async function sendChatMessage(history, userMessage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Backend error:", res.status, data);
      if (res.status === 429) {
        return "⏳ AgriBot is busy. Please wait 30 seconds and try again.";
      }
      if (res.status === 400) {
        return "Please type a message before sending.";
      }
      return data.error ?? `Error ${res.status}. Please try again.`;
    }

    return (
      data.response ?? "I didn't receive a proper response. Please rephrase."
    );
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("chatService fetch error:", error);

    if (error.name === "AbortError") {
      return "⏱️ Request timed out. Please try again.";
    }
    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError")
    ) {
      return "🔌 Cannot connect to AgriBot server. Make sure the backend is running on port 5000.";
    }
    return "Network error. Please check your connection.";
  }
}

/** Suggested quick-start questions shown on chatbot open. */
export const SUGGESTED_QUESTIONS = [
  "What is PM-KISAN and how to apply?",
  "Best crops to grow in summer?",
  "How to improve soil fertility naturally?",
  "When should I irrigate wheat?",
  "How to get crop insurance under PMFBY?",
  "Tractor rent vs buy — which is better?",
];
