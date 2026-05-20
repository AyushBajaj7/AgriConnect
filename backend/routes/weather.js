const express = require("express");
const {
  fetchAirQuality,
  fetchCurrentByCity,
  fetchCurrentByCoords,
  fetchForecastByCity,
  fetchForecastByCoords,
  fetchRecentPrecipitation,
} = require("../services/weatherService");

const router = express.Router();

function missingParameter(response, name) {
  return response.status(400).json({ error: `${name} is required.` });
}

router.get("/weather/current", async (request, response) => {
  const { city, lat, lon } = request.query;
  if (city) {
    return response.status(200).json(await fetchCurrentByCity(String(city)));
  }
  if (lat && lon) {
    return response
      .status(200)
      .json(await fetchCurrentByCoords(String(lat), String(lon)));
  }
  return missingParameter(response, "city or lat/lon");
});

router.get("/weather/forecast", async (request, response) => {
  const { city, lat, lon } = request.query;
  if (city) {
    return response.status(200).json(await fetchForecastByCity(String(city)));
  }
  if (lat && lon) {
    return response
      .status(200)
      .json(await fetchForecastByCoords(String(lat), String(lon)));
  }
  return missingParameter(response, "city or lat/lon");
});

router.get("/weather/air-quality", async (request, response) => {
  const { lat, lon } = request.query;
  if (!lat || !lon) {
    return missingParameter(response, "lat/lon");
  }
  return response.status(200).json(await fetchAirQuality(String(lat), String(lon)));
});

router.get("/weather/precipitation", async (request, response) => {
  const { lat, lon } = request.query;
  if (!lat || !lon) {
    return missingParameter(response, "lat/lon");
  }
  return response
    .status(200)
    .json(await fetchRecentPrecipitation(String(lat), String(lon)));
});

module.exports = router;
