const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 15000;

function getModelStatus() {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  return configured
    ? {
        state: "ready",
        provider: GEMINI_MODEL,
        message: "Gemini API is configured.",
      }
    : {
        state: "error",
        provider: GEMINI_MODEL,
        message: "GEMINI_API_KEY is missing from the backend environment.",
      };
}

function initML() {
  const status = getModelStatus();
  if (status.state !== "ready") {
    console.warn(status.message);
  }
}

function extractText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

async function getResponse(query) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error("Gemini API key is missing.");
    error.code = "MODEL_ERROR";
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are AgriBot, a practical agricultural assistant. Answer in clear plain text, keep the answer concise, and stay focused on farming and agricultural operations.\n\nUser question: ${query}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          topP: 0.85,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) {
      const error = new Error(await response.text());
      error.code =
        response.status === 429
          ? "MODEL_RATE_LIMIT"
          : response.status === 401 || response.status === 403
            ? "MODEL_ERROR"
            : "MODEL_UPSTREAM";
      throw error;
    }

    const payload = await response.json();
    const text = extractText(payload);

    if (!text) {
      const error = new Error("Gemini API returned no answer text.");
      error.code = "MODEL_UPSTREAM";
      throw error;
    }

    return text;
  } catch (error) {
    if (error.name === "AbortError") {
      error.code = "MODEL_TIMEOUT";
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { initML, getModelStatus, getResponse };
