/**
 * File: weatherService.js
 * Description: API client for the OpenWeatherMap REST API.
 *              Provides functions for current weather, 5-day forecasts,
 *              and real-time air quality data.
 *              All functions return parsed JSON on success, or an object
 *              with an `error` string key on failure — no exceptions thrown.
 * Used in: pages/Weather/Weather.js
 *
 * API Reference: https://openweathermap.org/api
 */

/** @see https://openweathermap.org — replace with an env variable in production. */
const API_KEY = "6a173adde35f78487a42908af69bdf1d";

const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Shared fetch wrapper. Returns parsed JSON or a normalised error object.
 * Never throws — callers should check for `response.error` before using the data.
 *
 * @param {string} url - The fully constructed API endpoint URL.
 * @returns {Promise<object>}
 */
async function apiFetch(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const message =
        response.status === 404
          ? "City not found. Please check the spelling."
          : `API error ${response.status}. Please try again.`;
      return { error: message };
    }

    return await response.json();
  } catch {
    return { error: "Network error. Please check your connection." };
  }
}

/**
 * Fetches current weather conditions for a city name.
 * Results are in metric units (°C, m/s).
 *
 * @param {string} city - City name, e.g. "Delhi"
 * @returns {Promise<object>} OpenWeatherMap current weather object, or `{ error }`.
 */
export function fetchWeatherByCity(city) {
  const url = `${WEATHER_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  return apiFetch(url);
}

/**
 * Fetches current weather conditions for a geographic coordinate pair.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} OpenWeatherMap current weather object, or `{ error }`.
 */
export function fetchWeatherByCoords(lat, lon) {
  const url = `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  return apiFetch(url);
}

/**
 * Fetches a 5-day / 3-hour forecast for a city name.
 *
 * @param {string} city
 * @returns {Promise<object>} Forecast list object, or `{ error }`.
 */
export function fetchForecastByCity(city) {
  const url = `${WEATHER_BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  return apiFetch(url);
}

/**
 * Fetches a 5-day / 3-hour forecast for a coordinate pair.
 * Preferred over fetchForecastByCity when coordinates are already known
 * (avoids a second geocoding lookup).
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} Forecast list object, or `{ error }`.
 */
export function fetchForecastByCoords(lat, lon) {
  const url = `${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  return apiFetch(url);
}

/**
 * Fetches real-time Air Quality Index data from the OpenWeatherMap
 * Air Pollution API (free tier).
 * Returns AQI on a scale of 1–5 plus concentrations for PM2.5, PM10,
 * O₃, NO₂, SO₂ and CO.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} Air Pollution API response, or `{ error }`.
 */
export function fetchAirQuality(lat, lon) {
  // Uses http (not https) as required by the free-tier Air Pollution endpoint.
  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  return apiFetch(url);
}
