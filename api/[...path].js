// Vercel serverless entrypoint that reuses the existing Express backend.
const { app } = require("../backend/server");

module.exports = app;
