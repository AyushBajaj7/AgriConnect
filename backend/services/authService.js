const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { dataPath, readJson, writeJson } = require("./localStore");

const SESSION_COOKIE_NAME = "agriconnect_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const USERS_FILE = dataPath("users", "users.json");
const LEGACY_USERS_FILE = path.join(__dirname, "..", "users.json");
const LOCAL_SECRET_FILE = dataPath("system", "session-secret.json");

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return value === "true";
}

function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  const existing = readJson(LOCAL_SECRET_FILE, null);
  if (existing?.secret) {
    return existing.secret;
  }

  const secret = crypto.randomBytes(32).toString("hex");
  writeJson(LOCAL_SECRET_FILE, {
    secret,
    createdAt: new Date().toISOString(),
    note: "Local development secret. Set SESSION_SECRET in production.",
  });
  return secret;
}

function getAuthConfig() {
  const username = (process.env.ADMIN_USERNAME ?? "").trim();
  const passwordHash = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();
  const passwordPlain = process.env.ADMIN_PASSWORD ?? "";
  const secureCookies = parseBoolean(
    process.env.AUTH_COOKIE_SECURE,
    process.env.NODE_ENV === "production",
  );
  const sameSite =
    process.env.AUTH_COOKIE_SAME_SITE ?? (secureCookies ? "none" : "lax");

  return {
    username,
    passwordHash,
    passwordPlain,
    sessionSecret: getSessionSecret(),
    secureCookies,
    sameSite,
  };
}

function normalizeUsername(username) {
  return String(username ?? "").trim().toLowerCase();
}

function validateUsername(username) {
  const value = normalizeUsername(username);
  if (value.length < 3 || value.length > 32) {
    return "Username must be 3 to 32 characters.";
  }
  if (!/^[a-z0-9_.-]+$/.test(value)) {
    return "Username can use letters, numbers, dots, hyphens, and underscores only.";
  }
  return "";
}

function validatePassword(password) {
  const value = String(password ?? "");
  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "Password must include at least one letter and one number.";
  }
  return "";
}

function createUserRecord(username, passwordHash, role = "user") {
  const now = new Date().toISOString();
  return {
    username,
    passwordHash,
    role,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

function getInitialUsers() {
  const config = getAuthConfig();
  const users = {};

  if (config.username && (config.passwordHash || config.passwordPlain)) {
    users[normalizeUsername(config.username)] = createUserRecord(
      normalizeUsername(config.username),
      config.passwordHash || config.passwordPlain,
      "admin",
    );
  }

  return users;
}

function migrateLegacyUsers(users) {
  if (Object.keys(users).length || !fs.existsSync(LEGACY_USERS_FILE)) {
    return users;
  }

  const legacy = readJson(LEGACY_USERS_FILE, {});
  const migrated = {};

  for (const [username, storedPassword] of Object.entries(legacy)) {
    const normalized = normalizeUsername(username);
    migrated[normalized] = createUserRecord(
      normalized,
      String(storedPassword),
      normalized === normalizeUsername(process.env.ADMIN_USERNAME) ? "admin" : "user",
    );
  }

  return migrated;
}

function loadUsers() {
  let users = readJson(USERS_FILE, null);
  if (!users) {
    users = migrateLegacyUsers(getInitialUsers());
    writeJson(USERS_FILE, users);
    return users;
  }

  let changed = false;
  const normalizedUsers = {};
  for (const [username, value] of Object.entries(users)) {
    const normalized = normalizeUsername(username);
    if (typeof value === "string") {
      normalizedUsers[normalized] = createUserRecord(
        normalized,
        value,
        normalized === normalizeUsername(process.env.ADMIN_USERNAME) ? "admin" : "user",
      );
      changed = true;
    } else {
      normalizedUsers[normalized] = {
        username: normalized,
        role: value.role ?? "user",
        active: value.active !== false,
        createdAt: value.createdAt ?? new Date().toISOString(),
        updatedAt: value.updatedAt ?? new Date().toISOString(),
        passwordHash: value.passwordHash ?? value.password ?? "",
      };
    }
  }

  if (changed) {
    writeJson(USERS_FILE, normalizedUsers);
  }

  return normalizedUsers;
}

function saveUsers(users) {
  writeJson(USERS_FILE, users);
}

function isAuthConfigured() {
  return Boolean(getAuthConfig().sessionSecret);
}

function getAuthStatus() {
  return {
    configured: isAuthConfigured(),
    cookieName: SESSION_COOKIE_NAME,
    sameSite: getAuthConfig().sameSite,
    userStore: "local-file",
  };
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(String(password ?? ""), storedHash);
  }

  return timingSafeEqual(password, storedHash);
}

async function verifyCredentials(username, password) {
  if (!isAuthConfigured()) {
    return {
      ok: false,
      code: "AUTH_NOT_CONFIGURED",
      message: "Sign-in is not configured on the server.",
    };
  }

  const normalized = normalizeUsername(username);
  const users = loadUsers();
  const user = users[normalized];

  if (!user || user.active === false) {
    return {
      ok: false,
      code: "AUTH_INVALID",
      message: "Invalid username or password.",
    };
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return {
      ok: false,
      code: "AUTH_INVALID",
      message: "Invalid username or password.",
    };
  }

  return {
    ok: true,
    user: { username: user.username, role: user.role ?? "user" },
  };
}

async function registerUser(username, password) {
  if (!isAuthConfigured()) {
    return {
      ok: false,
      code: "AUTH_NOT_CONFIGURED",
      message: "Registration is not configured on the server.",
    };
  }

  const normalized = normalizeUsername(username);
  const usernameError = validateUsername(normalized);
  if (usernameError) {
    return { ok: false, code: "AUTH_VALIDATION", message: usernameError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, code: "AUTH_VALIDATION", message: passwordError };
  }

  const users = loadUsers();
  if (users[normalized]) {
    return {
      ok: false,
      code: "USER_EXISTS",
      message: "That username is already registered.",
    };
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  users[normalized] = createUserRecord(normalized, passwordHash, "user");
  saveUsers(users);

  return {
    ok: true,
    user: { username: normalized, role: "user" },
  };
}

function getCookieOptions() {
  const config = getAuthConfig();

  return {
    httpOnly: true,
    sameSite: config.sameSite,
    secure: config.secureCookies,
    maxAge: SESSION_DURATION_MS,
    path: "/",
  };
}

function createSessionToken(user) {
  const config = getAuthConfig();
  return jwt.sign(
    { sub: user.username, role: user.role ?? "user" },
    config.sessionSecret,
    { expiresIn: Math.floor(SESSION_DURATION_MS / 1000) },
  );
}

function setSessionCookie(response, user) {
  response.cookie(
    SESSION_COOKIE_NAME,
    createSessionToken(user),
    getCookieOptions(),
  );
}

function clearSessionCookie(response) {
  response.clearCookie(SESSION_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: undefined,
  });
}

function readSession(request) {
  const token = request.cookies?.[SESSION_COOKIE_NAME];
  if (!token || !isAuthConfigured()) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getAuthConfig().sessionSecret);
    const users = loadUsers();
    const user = users[normalizeUsername(payload.sub)];
    if (!user || user.active === false) {
      return null;
    }

    return {
      user: {
        username: user.username,
        role: user.role ?? payload.role ?? "user",
      },
    };
  } catch {
    return null;
  }
}

module.exports = {
  clearSessionCookie,
  getAuthStatus,
  isAuthConfigured,
  readSession,
  registerUser,
  setSessionCookie,
  validatePassword,
  validateUsername,
  verifyCredentials,
};
