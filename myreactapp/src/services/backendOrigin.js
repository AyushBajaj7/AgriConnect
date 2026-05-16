// Resolves the API origin for local development and same-origin production hosting.
export function getBackendOrigin() {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost:5000";
  }

  const isLocalHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalHost) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return window.location.origin;
}
