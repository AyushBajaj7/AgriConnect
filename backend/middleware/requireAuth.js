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

module.exports = { requireAuth };
