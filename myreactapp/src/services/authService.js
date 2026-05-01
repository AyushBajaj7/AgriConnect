const DEFAULT_BACKEND_ORIGIN =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000";

const AUTH_BASE_URL = `${(process.env.REACT_APP_BACKEND_URL ?? DEFAULT_BACKEND_ORIGIN).replace(/\/+$/, "")}/api/auth`;

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

export async function login(username, password) {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(response);

    if (!response.ok) {
      return {
        success: false,
        message:
          data.error ??
          (response.status === 401
            ? "Invalid username or password."
            : "Sign-in is unavailable right now."),
      };
    }

    return { success: true, user: data.user ?? null };
  } catch {
    return {
      success: false,
      message:
        "Sign-in service is unavailable. Check the backend deployment and try again.",
    };
  }
}

export async function register(username, password) {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(response);

    if (!response.ok) {
      return {
        success: false,
        message: data.error ?? "Registration is unavailable right now.",
      };
    }

    return { success: true, user: data.user ?? null };
  } catch {
    return {
      success: false,
      message:
        "Registration service is unavailable. Check the backend deployment and try again.",
    };
  }
}

export async function logout() {
  try {
    await fetch(`${AUTH_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network failures during logout; the frontend still clears local state.
  }
}

export async function getSession() {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/session`, {
      credentials: "include",
    });
    const data = await parseJson(response);

    if (!response.ok) {
      return {
        authenticated: false,
        message: data.error ?? "Session unavailable.",
      };
    }

    if (data.authenticated === false) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: data.user ?? null,
    };
  } catch {
    return {
      authenticated: false,
      message: "Session service is unavailable.",
    };
  }
}
