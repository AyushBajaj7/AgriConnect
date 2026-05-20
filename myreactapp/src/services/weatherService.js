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

import { getBackendOrigin } from "./backendOrigin";

// The frontend never calls the weather providers directly. All requests go through
// AgriConnect backend routes so provider credentials stay on the server.

const API_BASE_URL = `${getBackendOrigin()}/api/weather`;

/**
 * Shared fetch wrapper. Returns parsed JSON or a normalised error object.
 * Never throws — callers should check for `response.error` before using the data.
 *
 * @param {string} url - The fully constructed API endpoint URL.
 * @returns {Promise<object>}
 */
async function apiFetch(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      const message =
        response.status === 401
          ? "Weather service credentials are invalid."
          : response.status === 404
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
  const url = `${API_BASE_URL}/current?city=${encodeURIComponent(city)}`;
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
  const url = `${API_BASE_URL}/current?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  return apiFetch(url);
}

/**
 * Fetches a 5-day / 3-hour forecast for a coordinate pair.
 * Weather.js calls this after current weather resolves with coordinates.
 * This keeps the follow-up request aligned with the current location lookup.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} Forecast list object, or `{ error }`.
 */
export function fetchForecastByCoords(lat, lon) {
  const url = `${API_BASE_URL}/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
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
  const url = `${API_BASE_URL}/air-quality?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  return apiFetch(url);
}

/**
 * Fetches recent hourly precipitation and short-term temperature/rain forecast.
 * OpenWeather current weather may omit rain after it stops, so this supplements
 * the page with recent hourly rainfall history without needing another API key.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>}
 */
export async function fetchRecentPrecipitation(lat, lon) {
  const url = `${API_BASE_URL}/precipitation?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  return apiFetch(url);
}
