const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 15000;
const LOCAL_FALLBACK_ENABLED = process.env.AI_LOCAL_FALLBACK !== "false";

const FALLBACK_ANSWERS = [
  {
    keywords: ["pm-kisan", "pm kisan", "kisan samman"],
    answer:
      "PM-KISAN gives eligible farmer families direct income support in installments. Check eligibility, Aadhaar, land record, and bank details on the official PM-KISAN portal or at a Common Service Centre before applying.",
  },
  {
    keywords: ["insurance", "pmfby", "fasal bima"],
    answer:
      "For crop insurance, check Pradhan Mantri Fasal Bima Yojana details for your crop, season, state, and bank enrollment window. Keep land records, sowing details, Aadhaar, and bank account information ready.",
  },
  {
    keywords: ["soil", "fertility", "fertilizer", "compost"],
    answer:
      "Start with a soil test. Use compost or well-decomposed farmyard manure, rotate crops, include legumes when suitable, and apply chemical fertilizer based on soil-health recommendations instead of guessing.",
  },
  {
    keywords: ["irrigate", "irrigation", "water", "wheat"],
    answer:
      "Irrigation timing depends on crop stage, soil type, and weather. For wheat, critical stages include crown-root initiation, tillering, flowering, and grain filling. Avoid over-watering and check soil moisture before irrigating.",
  },
  {
    keywords: ["mandi", "price", "market"],
    answer:
      "Use the Market Prices page for mandi rates. If the live source is unavailable, AgriConnect shows the last successful live update or clearly labeled reference prices instead of fake live values.",
  },
  {
    keywords: ["weather", "rain", "temperature"],
    answer:
      "Use the Weather page before spraying, irrigation, or harvesting. Avoid pesticide spray before rain or during strong wind, and plan irrigation around rainfall and soil moisture.",
  },
];

function getModelStatus() {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  return configured
    ? {
        state: "ready",
        provider: GEMINI_MODEL,
        fallback: LOCAL_FALLBACK_ENABLED ? "enabled" : "disabled",
        message: "Gemini API is configured.",
      }
    : {
        state: LOCAL_FALLBACK_ENABLED ? "degraded" : "error",
        provider: LOCAL_FALLBACK_ENABLED ? "local-fallback" : GEMINI_MODEL,
        fallback: LOCAL_FALLBACK_ENABLED ? "enabled" : "disabled",
        message: LOCAL_FALLBACK_ENABLED
          ? "Gemini is not configured. Local fallback answers are enabled."
          : "GEMINI_API_KEY is missing from the backend environment.",
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
    return getLocalFallbackResponse(query);
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
    if (LOCAL_FALLBACK_ENABLED) {
      console.warn("Gemini unavailable. Using local fallback.", error.message);
      return getLocalFallbackResponse(query);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getLocalFallbackResponse(query) {
  const normalized = String(query ?? "").toLowerCase();
  const match = FALLBACK_ANSWERS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (match) {
    return `${match.answer}\n\nThis is a local fallback answer because the main AI service is unavailable. Please verify important scheme or price details on official sources.`;
  }

  return "The main AI service is unavailable, so I can only give basic guidance right now. Please ask about crop planning, soil health, irrigation, crop insurance, government schemes, mandi prices, or weather planning.";
}

module.exports = { initML, getModelStatus, getResponse };
