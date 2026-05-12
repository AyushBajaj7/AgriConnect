const express = require("express");
const { requireAdmin, requireAuth } = require("../middleware/requireAuth");
const {
  isReviewLogFresh,
  readReviewLog,
  runSchemeSourceCheck,
} = require("../services/schemeReviewService");

const router = express.Router();

router.get("/schemes/review-log", requireAuth, async (_request, response) => {
  const log = readReviewLog();
  if (isReviewLogFresh(log)) {
    return response.status(200).json(log);
  }

  const refreshed = await runSchemeSourceCheck();
  return response.status(200).json(refreshed);
});

router.post(
  "/schemes/check-links",
  requireAuth,
  requireAdmin,
  async (_request, response) => {
    const result = await runSchemeSourceCheck();
    return response.status(200).json(result);
  },
);

module.exports = router;
