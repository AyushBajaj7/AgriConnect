const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  clearSessionCookie,
  getAuthStatus,
  isAuthConfigured,
  readSession,
  setSessionCookie,
  verifyCredentials,
  registerUser,
} = require("../services/authService");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

router.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});

router.post("/login", loginLimiter, async (request, response) => {
  const { username, password } = request.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return response.status(400).json({
      error: "Username and password are required.",
    });
  }

  const result = await verifyCredentials(username, password);

  if (!result.ok) {
    const statusCode = result.code === "AUTH_NOT_CONFIGURED" ? 503 : 401;
    return response.status(statusCode).json({ error: result.message });
  }

  setSessionCookie(response, result.user);
  return response.status(200).json({
    user: result.user,
  });
});

router.post("/register", loginLimiter, async (request, response) => {
  const { username, password } = request.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return response.status(400).json({
      error: "Username and password are required.",
    });
  }

  const result = await registerUser(username.trim(), password);

  if (!result.ok) {
    const statusCode = result.code === "USER_EXISTS" ? 409 : 503;
    return response.status(statusCode).json({ error: result.message });
  }

  setSessionCookie(response, result.user);
  return response.status(201).json({
    user: result.user,
  });
});

router.get("/session", (request, response) => {
  if (!isAuthConfigured()) {
    return response.status(503).json({
      error: "Authentication is not configured on the backend.",
    });
  }

  const session = readSession(request);

  if (!session) {
    return response.status(200).json({
      authenticated: false,
      user: null,
    });
  }

  return response.status(200).json({
    authenticated: true,
    user: session.user,
  });
});

router.post("/logout", (_request, response) => {
  clearSessionCookie(response);
  return response.status(200).json({ ok: true });
});

router.get("/status", (_request, response) => {
  return response.status(200).json(getAuthStatus());
});

module.exports = router;
