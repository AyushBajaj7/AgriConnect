const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const SESSION_COOKIE_NAME = "agriconnect_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const USERS_FILE = path.join(__dirname, "..", "users.json");

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return value === "true";
}

function getAuthConfig() {
  const username = (process.env.ADMIN_USERNAME ?? "").trim();
  const passwordHash = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();
  const passwordPlain = process.env.ADMIN_PASSWORD ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "default_secret_for_local_dev";
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
    sessionSecret,
    secureCookies,
    sameSite,
  };
}

function isAuthConfigured() {
  const config = getAuthConfig();
  return Boolean(config.sessionSecret);
}

function getAuthStatus() {
  return {
    configured: isAuthConfigured(),
    cookieName: SESSION_COOKIE_NAME,
    sameSite: getAuthConfig().sameSite,
  };
}

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const config = getAuthConfig();
    const initialUsers = {};
    if (config.username) {
       initialUsers[config.username] = config.passwordHash || config.passwordPlain;
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
    return initialUsers;
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

async function verifyCredentials(username, password) {
  if (!isAuthConfigured()) {
    return {
      ok: false,
      code: "AUTH_NOT_CONFIGURED",
      message: "Authentication is not configured on the backend.",
    };
  }

  const users = loadUsers();
  const storedPass = users[username];

  if (!storedPass) {
    return {
      ok: false,
      code: "AUTH_INVALID",
      message: "Invalid username or password.",
    };
  }

  let passwordValid = false;
  if (storedPass.startsWith("$2")) {
    passwordValid = await bcrypt.compare(String(password ?? ""), storedPass);
  } else {
    passwordValid = timingSafeEqual(password, storedPass);
  }

  if (!passwordValid) {
    return {
      ok: false,
      code: "AUTH_INVALID",
      message: "Invalid username or password.",
    };
  }

  return {
    ok: true,
    user: { username },
  };
}

async function registerUser(username, password) {
  if (!isAuthConfigured()) {
    return {
      ok: false,
      code: "AUTH_NOT_CONFIGURED",
      message: "Authentication is not configured on the backend.",
    };
  }

  const users = loadUsers();
  if (users[username]) {
    return {
      ok: false,
      code: "USER_EXISTS",
      message: "Username already exists.",
    };
  }

  const hash = await bcrypt.hash(String(password ?? ""), 10);
  users[username] = hash;
  saveUsers(users);

  return {
    ok: true,
    user: { username },
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
  return jwt.sign({ sub: user.username }, config.sessionSecret, {
    expiresIn: Math.floor(SESSION_DURATION_MS / 1000),
  });
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
    return {
      user: {
        username: payload.sub,
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
  setSessionCookie,
  verifyCredentials,
  registerUser,
};
