const express = require("express");
const { getMandiPrices, getPriceStatus } = require("../services/priceService");

const router = express.Router();

router.get("/prices", async (_request, response) => {
  try {
    const result = await getMandiPrices();
    return response.status(200).json(result);
  } catch (error) {
    return response.status(503).json({
      records: [],
      meta: {
        source: "unavailable",
        label: "Live prices unavailable",
        warning:
          "The live mandi source is unavailable and no saved live cache exists yet.",
        fetchedAt: null,
        stale: false,
      },
      error: error.message,
    });
  }
});

router.get("/prices/status", (_request, response) => {
  return response.status(200).json(getPriceStatus());
});

module.exports = router;
