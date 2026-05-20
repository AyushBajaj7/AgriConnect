const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 15000;

function getWeatherApiKey() {
  return process.env.OPENWEATHER_API_KEY?.trim() || "";
}

async function fetchJson(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const message =
        response.status === 401
          ? "Weather service credentials are invalid."
          : response.status === 404
            ? "City not found. Please check the spelling."
            : `Weather service error ${response.status}. Please try again.`;
      return { error: message };
    }

    return await response.json();
  } catch {
    return { error: "Weather service is unavailable right now." };
  } finally {
    clearTimeout(timeout);
  }
}

function buildOpenWeatherUrl(endpoint, params) {
  const apiKey = getWeatherApiKey();
  if (!apiKey) {
    return null;
  }

  const search = new URLSearchParams({
    ...params,
    appid: apiKey,
  });

  return `${OPENWEATHER_BASE_URL}/${endpoint}?${search}`;
}

async function fetchCurrentByCity(city) {
  const url = buildOpenWeatherUrl("weather", {
    q: city,
    units: "metric",
  });
  return url ? fetchJson(url) : { error: "Weather service is not configured." };
}

async function fetchCurrentByCoords(lat, lon) {
  const url = buildOpenWeatherUrl("weather", {
    lat,
    lon,
    units: "metric",
  });
  return url ? fetchJson(url) : { error: "Weather service is not configured." };
}

async function fetchForecastByCity(city) {
  const url = buildOpenWeatherUrl("forecast", {
    q: city,
    units: "metric",
  });
  return url ? fetchJson(url) : { error: "Weather service is not configured." };
}

async function fetchForecastByCoords(lat, lon) {
  const url = buildOpenWeatherUrl("forecast", {
    lat,
    lon,
    units: "metric",
  });
  return url ? fetchJson(url) : { error: "Weather service is not configured." };
}

async function fetchAirQuality(lat, lon) {
  const url = buildOpenWeatherUrl("air_pollution", {
    lat,
    lon,
  });
  return url ? fetchJson(url) : { error: "Weather service is not configured." };
}

async function fetchRecentPrecipitation(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "precipitation,temperature_2m",
    past_hours: "24",
    forecast_hours: "48",
    timezone: "auto",
    precipitation_unit: "mm",
  });

  return fetchJson(`${OPEN_METEO_FORECAST_URL}?${params}`);
}

module.exports = {
  fetchAirQuality,
  fetchCurrentByCity,
  fetchCurrentByCoords,
  fetchForecastByCity,
  fetchForecastByCoords,
  fetchRecentPrecipitation,
  getWeatherApiKey,
};
