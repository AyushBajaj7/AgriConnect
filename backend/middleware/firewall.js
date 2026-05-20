const rateLimit = require("express-rate-limit");

const DEFAULT_BLOCKED_PATTERNS = [
  /\.\./,
  /<script/i,
  /\bunion\b.+\bselect\b/i,
  /\bselect\b.+\bfrom\b/i,
  /\bwp-admin\b/i,
  /\bphpmyadmin\b/i,
  /\.env\b/i,
  /\/etc\/passwd/i,
];

function parseCsv(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getClientIp(request) {
  return (
    request.ip ||
    request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    request.socket?.remoteAddress ||
    ""
  );
}

function createFirewall() {
  const deniedIps = new Set(parseCsv(process.env.FIREWALL_DENY_IPS));
  const allowedIps = new Set(parseCsv(process.env.FIREWALL_ALLOW_IPS));
  const enforceAllowList = process.env.FIREWALL_ENFORCE_ALLOWLIST === "true";
  const maxUrlLength = Number.parseInt(
    process.env.FIREWALL_MAX_URL_LENGTH ?? "2048",
    10,
  );

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number.parseInt(process.env.FIREWALL_MAX_REQUESTS_PER_MINUTE ?? "180", 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Please wait and try again.",
    },
  });

  function rules(request, response, next) {
    response.setHeader("X-AgriConnect-Firewall", "active");

    const ip = getClientIp(request);
    if (enforceAllowList && allowedIps.size && !allowedIps.has(ip)) {
      return response.status(403).json({ error: "Request blocked by firewall." });
    }

    if (deniedIps.has(ip)) {
      return response.status(403).json({ error: "Request blocked by firewall." });
    }

    if (request.originalUrl.length > maxUrlLength) {
      return response.status(414).json({ error: "Request URL is too long." });
    }

    if (DEFAULT_BLOCKED_PATTERNS.some((pattern) => pattern.test(request.originalUrl))) {
      return response.status(403).json({ error: "Request blocked by firewall." });
    }

    return next();
  }

  return [rules, globalLimiter];
}

module.exports = { createFirewall };
