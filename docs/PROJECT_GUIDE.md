# AgriConnect Project Guide

This document explains the project in the order a new developer should understand it.

## What The App Does

AgriConnect has two parts:

- A React frontend in `myreactapp/`.
- A Node/Express backend in `backend/`.

Users open the frontend in the browser. The frontend calls backend API routes for login, chatbot, weather, live mandi prices, and scheme link checks.

## Main User Flows

### 1. Login And Registration

Frontend files:

- `myreactapp/src/pages/Login/Login.js`
- `myreactapp/src/context/AuthContext.js`
- `myreactapp/src/services/authService.js`

Backend files:

- `backend/routes/auth.js`
- `backend/services/authService.js`

The browser sends username and password to `/api/auth/login` or `/api/auth/register`.

The backend hashes passwords, signs a secure session cookie, and returns the logged-in user. In local development, registered users are stored in a JSON file under backend data storage.

On Vercel, file storage is temporary. To keep same-browser registration usable when temporary storage resets, the backend also sets an encrypted HttpOnly recovery cookie. This is not a replacement for a real permanent account database, but it avoids losing the user immediately in serverless runtime resets.

### 2. Crop Prices

Frontend files:

- `myreactapp/src/pages/CropPrices/CropPrices.js`
- `myreactapp/src/services/priceService.js`

Backend files:

- `backend/routes/prices.js`
- `backend/services/priceService.js`

The frontend calls `/api/prices`.

The backend tries the official data.gov.in mandi API using `AGMARKNET_API_KEY`. If live data works, the backend returns live prices and updates the cache. If live data fails, it returns the last saved live cache or reference data depending on what is available.

### 3. Weather

Frontend files:

- `myreactapp/src/pages/Weather/Weather.js`
- `myreactapp/src/services/weatherService.js`

Backend files:

- `backend/routes/weather.js`
- `backend/services/weatherService.js`

The frontend calls `/api/weather/*`. The browser does not receive the OpenWeather API key.

The backend uses `OPENWEATHER_API_KEY` for current weather, forecast, and air quality. Rainfall history uses Open-Meteo, which does not need an API key.

### 4. Government Schemes

Frontend files:

- `myreactapp/src/pages/GovernmentSchemes/GovernmentSchemes.js`
- `myreactapp/src/pages/SchemeDetails/SchemeDetails.js`
- `myreactapp/src/services/schemeService.js`

Backend files:

- `backend/routes/schemes.js`
- `backend/services/schemeReviewService.js`

Schemes are a reviewed local reference directory. The list is sorted by status so open schemes appear first. The visible "Scheme 1", "Scheme 2" labels are display numbers only; each scheme still has a stable internal ID for detail-page routing.

### 5. Chatbot

Frontend files:

- `myreactapp/src/components/Chatbot/Chatbot.js`
- `myreactapp/src/services/chatService.js`

Backend files:

- `backend/routes/chat.js`
- `backend/services/mlService.js`

The chatbot calls `/api/chat`. The backend uses Gemini when `GEMINI_API_KEY` is configured. If Gemini fails and `AI_LOCAL_FALLBACK=true`, a limited local fallback answer is returned instead of crashing the UI.

## Why There Are Two API Folders

There are two Vercel API entrypoint folders:

- `api/`
- `myreactapp/api/`

This is intentional. During deployment, Vercel can be configured with the repo root or `myreactapp` as the root directory. Keeping both entrypoint sets prevents `/api/*` from breaking when that setting changes.

Most real backend logic should still live in `backend/`. The API entrypoints should stay thin.

## What Not To Edit First

Avoid changing these until you understand the flow:

- `backend/services/priceService.js` - live API, cache, fallback logic.
- `backend/services/authService.js` - password hashing, JWT cookies, recovery cookie.
- `myreactapp/src/services/priceService.js` - frontend fallback and price normalization.
- `vercel.json` and `myreactapp/vercel.json` - deployment routing.

## Safe Starting Points

For UI text/layout:

- `myreactapp/src/pages/Dashboard/`
- `myreactapp/src/pages/GovernmentSchemes/`
- `myreactapp/src/pages/FarmingTools/`
- `myreactapp/src/components/Card/`

For data text:

- `myreactapp/src/services/schemeService.js`
- `myreactapp/src/pages/FarmingTools/FarmingTools.js`

For API behavior:

- Start at the matching file in `backend/routes/`.
- Then read the matching file in `backend/services/`.
