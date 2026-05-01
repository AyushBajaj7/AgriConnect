/**
 * Frontend chat service for the AgriConnect backend.
 * Sends user questions to the backend API and returns the generated reply.
 */

const DEFAULT_BACKEND_ORIGIN =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000";

const BACKEND_URL = `${(process.env.REACT_APP_BACKEND_URL ?? DEFAULT_BACKEND_ORIGIN).replace(/\/+$/, "")}/api/chat`;

/**
 * Sends a user message to the backend and returns the AI response text.
 *
 * @param {string} userMessage - The new user message
 * @returns {Promise<string>} The AI response text
 */
export async function sendChatMessage(userMessage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
        return "AgriBot is busy. Please wait 30 seconds and try again.";
      }
      if (res.status === 400) {
        return "Please type a message before sending.";
      }
      if (res.status === 401) {
        return "Your session has expired. Please sign in again.";
      }
      if (res.status === 503) {
        return (
          data.error ??
          "AgriBot is starting up. Please wait a moment and try again."
        );
      }
      if (res.status === 504) {
        return "AgriBot took too long to respond. Please try again.";
      }
      if (res.status >= 500) {
        return (
          data.error ??
          "AgriBot could not respond right now. Please try again shortly."
        );
      }
      return data.error ?? `Error ${res.status}. Please try again.`;
    }

    return data.response ?? "I didn't receive a proper response. Please rephrase.";
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("chatService fetch error:", error);

    if (error.name === "AbortError") {
      return "Request timed out. Please try again.";
    }
    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError")
    ) {
      return "AgriBot is unavailable right now. Check the backend deployment or REACT_APP_BACKEND_URL configuration.";
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
  "Tractor rent vs buy - which is better?",
];
