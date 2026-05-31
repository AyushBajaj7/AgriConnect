# File Map

This is a practical map of the project. It does not list every generated file, only files that matter for development.

## Root

| Path | Purpose |
| --- | --- |
| `README.md` | Start here. Setup, deployment, and links to deeper docs. |
| `package.json` | Root helper commands for frontend build and backend/frontend startup. |
| `vercel.json` | Vercel build output, API function config, and SPA rewrites. |
| `.gitignore` | Keeps secrets, build output, logs, data cache, and generated files out of Git. |

## Vercel API Entrypoints

| Path | Purpose |
| --- | --- |
| `api/[...path].js` | Root catch-all Vercel function that forwards to the Express backend. |
| `api/auth/*.js` | Explicit auth routes for Vercel routing. |
| `api/prices.js` | Explicit crop price route. |
| `api/weather.js` and `api/weather/[...path].js` | Explicit weather routes, including nested routes like `/api/weather/current`. |
| `myreactapp/api/*` | Same idea as root `api/`, used if Vercel deploys from `myreactapp`. |

## Backend

| Path | Purpose |
| --- | --- |
| `backend/server.js` | Creates the Express app, attaches middleware, mounts routes, exports the app for Vercel. |
| `backend/middleware/firewall.js` | Basic request firewall and rate limiting. |
| `backend/middleware/requireAuth.js` | Protects routes that require a logged-in user or admin. |
| `backend/routes/auth.js` | Login, register, session, logout, auth status endpoints. |
| `backend/routes/chat.js` | Chatbot API endpoint. |
| `backend/routes/prices.js` | Crop price API endpoints. |
| `backend/routes/schemes.js` | Scheme review/check endpoints. |
| `backend/routes/weather.js` | Weather proxy endpoints. |
| `backend/services/authService.js` | Password validation, password hashing, session cookies, user storage, recovery cookie. |
| `backend/services/localStore.js` | Local JSON storage helper. Uses temporary storage on Vercel. |
| `backend/services/mlService.js` | Gemini integration and local chatbot fallback. |
| `backend/services/priceService.js` | data.gov.in mandi API, cache, reference fallback, price status. |
| `backend/services/schemeReviewService.js` | Checks official scheme links and stores review log. |
| `backend/services/weatherService.js` | OpenWeather and Open-Meteo backend fetch logic. |
| `backend/.env.example` | Backend environment template. Safe to commit. |
| `backend/.env` | Real local secrets. Ignored by Git. |

## Frontend

| Path | Purpose |
| --- | --- |
| `myreactapp/src/index.js` | React entrypoint. |
| `myreactapp/src/App.js` | App-level component setup. |
| `myreactapp/src/components/Layout/AppLayout.js` | Main route definitions and protected pages. |
| `myreactapp/src/context/AuthContext.js` | Frontend auth state and session loading. |
| `myreactapp/src/components/Navbar/` | Navigation bar. |
| `myreactapp/src/components/Footer/` | Footer links. |
| `myreactapp/src/components/Chatbot/` | Floating chatbot UI. |
| `myreactapp/src/pages/Login/` | Login/register page. |
| `myreactapp/src/pages/Dashboard/` | Main dashboard page. |
| `myreactapp/src/pages/CropPrices/` | Market price page. |
| `myreactapp/src/pages/GovernmentSchemes/` | Scheme list page. |
| `myreactapp/src/pages/SchemeDetails/` | Individual scheme detail page. |
| `myreactapp/src/pages/FarmingTools/` | Farming equipment reference page. |
| `myreactapp/src/pages/Weather/` | Weather and rainfall analysis page. |
| `myreactapp/src/services/backendOrigin.js` | Decides which backend URL the frontend should call. |
| `myreactapp/src/services/authService.js` | Frontend auth API client. |
| `myreactapp/src/services/chatService.js` | Frontend chatbot API client. |
| `myreactapp/src/services/priceService.js` | Frontend crop price normalization and fallback handling. |
| `myreactapp/src/services/schemeService.js` | Reviewed scheme dataset and scheme helper functions. |
| `myreactapp/src/services/weatherService.js` | Frontend weather API client; calls backend proxy only. |
| `myreactapp/src/styles/global.css` | Shared design tokens and global styles. |

## Generated Or Local-Only Files

Do not push these:

- `backend/.env`
- `backend/data/`
- `backend/users.json`
- `backend/*.log`
- `myreactapp/build/`
- `node_modules/`
- `.graphifyignore`
- `graphify-out/`
