# AgriConnect

AgriConnect is a full-stack agriculture web app for dashboard access, government scheme references, live mandi prices, weather analysis, farming tools, and an AI assistant.

## Read First

If the project feels too large, start here:

1. [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) - plain-English overview of how the app works.
2. [docs/FILE_MAP.md](docs/FILE_MAP.md) - what each folder and important file is for.
3. [docs/API_AND_DATA_FLOW.md](docs/API_AND_DATA_FLOW.md) - how login, weather, crop prices, schemes, and chatbot requests move through the system.

## Repo Structure

```text
NewAgri/
  api/          Vercel API entrypoints when deploying from the repo root
  backend/      Express backend used locally and by Vercel API functions
  docs/         Human-readable project documentation
  myreactapp/   Create React App frontend
  package.json  Root helper scripts
  vercel.json   Vercel build and routing config
```

## Local Development

Install backend and frontend dependencies once:

```bash
cd backend
npm install

cd ../myreactapp
npm install
```

Run the backend:

```bash
cd backend
npm run dev
```

The backend listens on `http://localhost:5000`.

Run the frontend in another terminal:

```bash
cd myreactapp
npm start
```

The frontend runs on `http://localhost:3000`.

## Environment Variables

Secrets belong in `backend/.env` locally and in Vercel Project Settings for production. Do not commit `.env`.

Required backend values:

```bash
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
AGMARKNET_API_KEY=your_data_gov_api_key
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD_HASH=your_bcrypt_hash
SESSION_SECRET=long_random_secret
AI_LOCAL_FALLBACK=true
```

Optional frontend value:

```bash
REACT_APP_BACKEND_URL=https://your-backend-domain.example
```

Leave `REACT_APP_BACKEND_URL` empty for normal localhost work and same-domain Vercel hosting.

## Common Commands

From `NewAgri/`:

```bash
npm.cmd run build
npm.cmd run start:backend
npm.cmd run start:frontend
```

On this Windows machine, use `npm.cmd` if PowerShell blocks `npm`.

## Deployment Notes

- Vercel deploys the React frontend and `/api/*` serverless routes.
- `api/` and `myreactapp/api/` both exist because Vercel may be configured to deploy from either the repo root or the frontend folder.
- `backend/.env`, generated build files, logs, local users, and graphify output are ignored by Git.
- Vercel serverless file storage is temporary. Local JSON users and cache are useful for development, but they are not a permanent production database.

## Quick Health Checks

```bash
curl https://agri-connect-gamma-one.vercel.app/api/health
curl https://agri-connect-gamma-one.vercel.app/api/prices
curl "https://agri-connect-gamma-one.vercel.app/api/weather/current?city=Delhi"
```
