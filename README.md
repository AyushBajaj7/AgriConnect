# AgriConnect

AgriConnect is a full-stack agriculture web app with a React frontend and a separate Node/Express backend. The frontend provides a dashboard, crop prices, weather analysis, scheme references, tools, and a floating chatbot UI. The backend handles secure session auth and Gemini-backed chat responses.

## Repo structure

```text
NewAgri/
  backend/      Node + Express API for chat
  myreactapp/   Create React App frontend
  package.json  Root helper scripts for deployment
  vercel.json   Vercel frontend build configuration
```

## Local development

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend listens on `http://localhost:5000`.

### Frontend

```bash
cd myreactapp
npm install
npm start
```

The frontend runs on `http://localhost:3000`.

## Environment variables

### Frontend: `myreactapp/.env`

```bash
REACT_APP_BACKEND_URL=https://your-backend-domain.example
REACT_APP_OPENWEATHER_API_KEY=your_openweather_api_key
```

If this variable is not set, the frontend defaults to `http://localhost:5000`.

The weather page expects an OpenWeather API key. Crop prices will fall back to
curated reference data when the Agmarknet API is unavailable.

### Backend: `backend/.env`

```bash
PORT=5000
FRONTEND_ORIGIN=https://your-frontend-domain.example
GEMINI_API_KEY=your_gemini_api_key
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD_HASH=your_bcrypt_hash
SESSION_SECRET=long_random_secret
```

`FRONTEND_ORIGIN` can be a comma-separated list of allowed frontend origins.
For cross-site deployments, set secure cookie options if needed.

## Vercel deployment

The current Vercel setup in this repo is for the frontend only.

- Import the repo root `NewAgri/` into Vercel
- Vercel will use the root `vercel.json`
- The build output is `myreactapp/build`
- SPA routes are rewritten to `index.html`

Root build commands:

```bash
npm run install:frontend
npm run build
```

## Backend hosting note

The backend should run on a long-lived Node host because it manages session cookies and the chatbot provider integration. Point the frontend at it with `REACT_APP_BACKEND_URL`.

## Production checklist

1. Deploy the frontend from `NewAgri/` on Vercel
2. Deploy the backend on a long-running Node host
3. Set `REACT_APP_BACKEND_URL` and `REACT_APP_OPENWEATHER_API_KEY` in the frontend deployment
4. Set `FRONTEND_ORIGIN`, `GEMINI_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET` in the backend deployment
5. Verify `/dashboard`, `/weather`, `/crop-prices`, and chatbot connectivity after deploy
