const crypto = require("crypto");

const SESSION_COOKIE = "agriconnect_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const users = new Map();
let priceCache = null;

const CATEGORY_KEYWORDS = {
  vegetables: [
    "onion",
    "potato",
    "tomato",
    "gourd",
    "brinjal",
    "cabbage",
    "cauliflower",
    "okra",
    "chilli",
  ],
  fruits: ["mango", "banana", "apple", "orange", "grape", "papaya", "guava"],
  seeds: ["seed", "groundnut", "sunflower", "sesame", "castor"],
};

const REFERENCE_PRICES = [
  {
    id: "reference-wheat-delhi",
    market: "Delhi reference market",
    state: "Delhi",
    commodity: "Wheat",
    variety: "Common",
    category: "crops",
    modalPrice: 2450,
    minPrice: 2300,
    maxPrice: 2600,
    trend: "stable",
    source: "reference",
  },
  {
    id: "reference-rice-punjab",
    market: "Punjab reference market",
    state: "Punjab",
    commodity: "Paddy",
    variety: "Common",
    category: "crops",
    modalPrice: 2320,
    minPrice: 2200,
    maxPrice: 2450,
    trend: "stable",
    source: "reference",
  },
  {
    id: "reference-potato-up",
    market: "Uttar Pradesh reference market",
    state: "Uttar Pradesh",
    commodity: "Potato",
    variety: "Other",
    category: "vegetables",
    modalPrice: 1400,
    minPrice: 1100,
    maxPrice: 1700,
    trend: "stable",
    source: "reference",
  },
  {
    id: "reference-tomato-maharashtra",
    market: "Maharashtra reference market",
    state: "Maharashtra",
    commodity: "Tomato",
    variety: "Hybrid",
    category: "vegetables",
    modalPrice: 1800,
    minPrice: 1400,
    maxPrice: 2200,
    trend: "stable",
    source: "reference",
  },
  {
    id: "reference-banana-tamil-nadu",
    market: "Tamil Nadu reference market",
    state: "Tamil Nadu",
    commodity: "Banana",
    variety: "Other",
    category: "fruits",
    modalPrice: 2200,
    minPrice: 1800,
    maxPrice: 2600,
    trend: "stable",
    source: "reference",
  },
];

function sendJson(response, status, payload, headers = {}) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(headers)) {
    response.setHeader(key, value);
  }
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function getSecret() {
  return process.env.SESSION_SECRET || "agriconnect-vercel-fallback-secret";
}

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!stored.includes(":")) {
    return crypto.timingSafeEqual(Buffer.from(String(password)), Buffer.from(String(stored)));
  }
  const [salt] = stored.split(":");
  return hashPassword(password, salt) === stored;
}

function createToken(user) {
  const payload = base64Url({
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  });
  return `${payload}.${sign(payload)}`;
}

function readSession(request) {
  const cookie = request.headers.cookie || "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || signature !== sign(payload)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.exp < Date.now()) return null;
    return { user: { username: session.username, role: session.role || "user" } };
  } catch {
    return null;
  }
}

function setSession(response, user) {
  const secure = process.env.NODE_ENV === "production";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${createToken(user)}; HttpOnly; Path=/; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000,
    )}; SameSite=${secure ? "None" : "Lax"}${secure ? "; Secure" : ""}`,
  );
}

function ensureAdminUser() {
  const username = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (username && password && !users.has(username)) {
    users.set(username, {
      username,
      role: "admin",
      passwordHash: hashPassword(password),
    });
  }
}

function validateUserInput(username, password) {
  const normalized = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(normalized)) {
    return { error: "Username must be 3 to 32 characters and use letters, numbers, dots, hyphens, or underscores." };
  }
  if (String(password || "").length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: "Password must be at least 8 characters with one letter and one number." };
  }
  return { username: normalized };
}

function categorizeCommodity(name) {
  const lower = String(name || "").toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return "crops";
}

function normalizePriceRecord(record, index) {
  const commodity = record.commodity || record.Commodity || "Commodity";
  const market = record.market || record.Market || "Market";
  const state = record.state || record.State || "India";
  const variety = record.variety || record.Variety || "Other";
  const modalPrice = Number(record.modal_price || record["Modal Price"] || record.modalPrice || 0);
  const minPrice = Number(record.min_price || record["Min Price"] || record.minPrice || modalPrice);
  const maxPrice = Number(record.max_price || record["Max Price"] || record.maxPrice || modalPrice);

  return {
    id: `${state}-${market}-${commodity}-${variety}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    market,
    state,
    commodity,
    variety,
    category: categorizeCommodity(`${commodity} ${variety}`),
    modalPrice,
    minPrice,
    maxPrice,
    trend: "stable",
    source: "live",
  };
}

async function getPrices() {
  const now = new Date().toISOString();
  if (priceCache && Date.now() - priceCache.time < 10 * 60 * 1000) {
    return {
      records: priceCache.records,
      meta: {
        source: "cached",
        label: "Saved live prices",
        cacheUpdatedAt: priceCache.updatedAt,
        checkedAt: now,
        nextLiveCheckAt: new Date(priceCache.time + 10 * 60 * 1000).toISOString(),
        uniqueRecords: priceCache.records.length,
      },
    };
  }

  const apiKey = process.env.AGMARKNET_API_KEY;
  if (apiKey) {
    const url =
      `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(
        apiKey,
      )}&format=json&limit=1000`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        const records = (data.records || []).map(normalizePriceRecord);
        if (records.length) {
          priceCache = { records, time: Date.now(), updatedAt: now };
          return {
            records,
            meta: {
              source: "live",
              label: "Live mandi prices",
              cacheUpdatedAt: now,
              checkedAt: now,
              nextLiveCheckAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              uniqueRecords: records.length,
            },
          };
        }
      }
    } catch {
      clearTimeout(timeout);
    }
  }

  return {
    records: REFERENCE_PRICES,
    meta: {
      source: "reference",
      label: "Reference prices",
      warning: "Live mandi prices are unavailable. Showing reviewed reference prices.",
      cacheUpdatedAt: now,
      checkedAt: now,
      nextLiveCheckAt: null,
      uniqueRecords: REFERENCE_PRICES.length,
    },
  };
}

async function handleAuth(request, response, route) {
  ensureAdminUser();
  if (route === "status") {
    return sendJson(response, 200, {
      configured: true,
      cookieName: SESSION_COOKIE,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      userStore: "vercel-memory",
    });
  }
  if (route === "session") {
    const session = readSession(request);
    return sendJson(response, 200, session ? { authenticated: true, user: session.user } : { authenticated: false, user: null });
  }
  if (route === "logout") {
    response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
    return sendJson(response, 200, { ok: true });
  }

  const body = await readBody(request);
  const validation = validateUserInput(body.username, body.password);
  if (validation.error) return sendJson(response, 400, { error: validation.error });

  if (route === "register") {
    if (users.has(validation.username)) {
      return sendJson(response, 409, { error: "That username is already registered." });
    }
    const user = { username: validation.username, role: "user", passwordHash: hashPassword(body.password) };
    users.set(validation.username, user);
    setSession(response, user);
    return sendJson(response, 201, { user: { username: user.username, role: user.role } });
  }

  const user = users.get(validation.username);
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return sendJson(response, 401, { error: "Invalid username or password." });
  }
  setSession(response, user);
  return sendJson(response, 200, { user: { username: user.username, role: user.role } });
}

async function handleChat(request, response) {
  if (!readSession(request)) {
    return sendJson(response, 401, { error: "Sign in to use AgriBot." });
  }
  const body = await readBody(request);
  const message = String(body.message || "").toLowerCase();
  const reply = message.includes("price")
    ? "Use the Market Prices page for mandi prices. Live data is shown only when the source returns current records."
    : "AgriBot fallback is active. Ask about weather, mandi prices, schemes, soil, irrigation, or crop planning.";
  return sendJson(response, 200, { response: reply });
}

module.exports = async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);

  if (request.method === "OPTIONS") return sendJson(response, 200, { ok: true });
  if (!parts.length || parts[0] === "health") {
    return sendJson(response, 200, { status: "ok", service: "AgriConnect Vercel API" });
  }
  if (parts[0] === "auth") return handleAuth(request, response, parts[1]);
  if (parts[0] === "prices") return sendJson(response, 200, await getPrices());
  if (parts[0] === "chat" && request.method === "POST") return handleChat(request, response);
  return sendJson(response, 404, { error: "API route not found." });
};
