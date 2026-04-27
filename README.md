# AgriConnect

AgriConnect is a full-stack agriculture web app with a React frontend and a separate Node/Express backend. The frontend provides dashboards, crop prices, weather, schemes, tools, and a floating chatbot UI. The backend handles chat requests with a local `@xenova/transformers` model.

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
```

If this variable is not set, the frontend defaults to `http://localhost:5000`.

### Backend: `backend/.env`

```bash
PORT=5000
FRONTEND_ORIGIN=https://your-frontend-domain.example
```

`FRONTEND_ORIGIN` can be a comma-separated list of allowed frontend origins.

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

The backend is not a good fit for a Vercel serverless function in its current form because it loads a local transformer model into memory at startup. Host it as a long-running Node service instead, then point the frontend at it with `REACT_APP_BACKEND_URL`.

## Production checklist

1. Deploy the frontend from `NewAgri/` on Vercel
2. Deploy the backend on a long-running Node host
3. Set `REACT_APP_BACKEND_URL` in the frontend deployment
4. Set `FRONTEND_ORIGIN` in the backend deployment
5. Verify `/login`, `/dashboard`, and chatbot connectivity after deploy
