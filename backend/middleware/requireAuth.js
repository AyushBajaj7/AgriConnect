const { readSession } = require("../services/authService");

function requireAuth(request, response, next) {
  const session = readSession(request);

  if (!session) {
    return response.status(401).json({
      error: "Please sign in to continue.",
    });
  }

  request.authUser = session.user;
  return next();
}

function requireAdmin(request, response, next) {
  if (request.authUser?.role !== "admin") {
    return response.status(403).json({
      error: "Administrator access is required.",
    });
  }

  return next();
}

module.exports = { requireAdmin, requireAuth };
