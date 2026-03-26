/**
 * File: authService.js
 * Description: Session authentication with security hardening —
 *              input sanitization, rate-limiting (5 attempts → 30s lockout),
 *              and 30-minute inactivity timeout.
 * Used in: pages/Login/Login.js, components/Navbar/Navbar.js, App.js
 */

const SESSION_KEY = "agriconnect_auth";
const FAILURES_KEY = "agriconnect_auth_failures";
const LAST_ACTIVITY_KEY = "agriconnect_last_activity";

const MAX_FAILURES = 5;
const LOCKOUT_MS = 30_000; // 30 seconds
const SESSION_TIMEOUT = 30 * 60_000; // 30 minutes

/** Demo credentials — replace with a real API in production. */
const DEMO_USER = { username: "admin", password: "password123" };

/** Strip characters that could be used for injection attacks. */
function sanitize(value) {
  return String(value ?? "")
    .replace(/[<>"'`%;(){}\\]/g, "")
    .trim()
    .slice(0, 100);
}

function getFailureRecord() {
  try {
    return JSON.parse(
      sessionStorage.getItem(FAILURES_KEY) ?? '{"count":0,"lockedUntil":0}',
    );
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

/**
 * Attempts login with rate-limiting and input sanitization.
 * @returns {{ success: boolean, message?: string, lockedSeconds?: number }}
 */
export function login(username, password) {
  const failures = getFailureRecord();

  // Reject if still within lockout window
  if (failures.lockedUntil > Date.now()) {
    const seconds = Math.ceil((failures.lockedUntil - Date.now()) / 1000);
    return {
      success: false,
      message: `Account locked. Try again in ${seconds}s.`,
      lockedSeconds: seconds,
    };
  }

  const cleanUser = sanitize(username);
  const cleanPass = sanitize(password);
  const isValid =
    cleanUser === DEMO_USER.username && cleanPass === DEMO_USER.password;

  if (!isValid) {
    const newCount = failures.count + 1;
    const shouldLock = newCount >= MAX_FAILURES;
    const lockedUntil = shouldLock ? Date.now() + LOCKOUT_MS : 0;

    sessionStorage.setItem(
      FAILURES_KEY,
      JSON.stringify({ count: newCount, lockedUntil }),
    );

    if (shouldLock) {
      return {
        success: false,
        message: `Too many failed attempts. Locked for ${LOCKOUT_MS / 1000}s.`,
      };
    }
    const remaining = MAX_FAILURES - newCount;
    return {
      success: false,
      message: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    };
  }

  // Successful login — clear failure record, write session
  sessionStorage.removeItem(FAILURES_KEY);
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ username: cleanUser, loggedIn: true }),
  );
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

  return { success: true };
}

/** Clears the session, effectively logging the user out. */
export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

/** Returns the authenticated user object, or null if not signed in. */
export function getAuthUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if a user is authenticated and the session has not timed out.
 * Also refreshes the inactivity timer on each call.
 */
export function isLoggedIn() {
  const user = getAuthUser();
  if (!user) return false;

  const lastActivity = parseInt(
    sessionStorage.getItem(LAST_ACTIVITY_KEY) ?? "0",
    10,
  );
  if (Date.now() - lastActivity > SESSION_TIMEOUT) {
    logout(); // auto-expire
    return false;
  }

  // Refresh activity timestamp
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  return true;
}

/** Returns remaining lockout seconds, or 0 if not locked. */
export function getLockoutSeconds() {
  const failures = getFailureRecord();
  if (failures.lockedUntil <= Date.now()) return 0;
  return Math.ceil((failures.lockedUntil - Date.now()) / 1000);
}
