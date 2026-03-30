# 🌾 AgriConnect - Intelligent Agricultural Assistant

AgriConnect is a comprehensive, full-stack web application designed to empower farmers and agricultural enthusiasts. It provides real-time data, AI-driven guidance, and critical agricultural resources. The platform features an intelligent, fully local NLP chatbot capable of answering complex farming queries without relying on external cloud LLM APIs.

---

## 🌟 Key Features

### 1. 🤖 Local AI AgriBot
- Powered by `@xenova/transformers` running directly in the Node.js backend.
- Custom machine learning service tailored to agricultural queries.
- Persistent floating chatbot widget available on every screen.

### 2. 📊 Live Crop Prices
- Real-time market data spanning various states and mandis (markets).
- Advanced filtering and dynamic trend indicators for crop valuation.

### 3. 🌤️ Weather Forecast & Crop Health Index (CHI)
- Provides 48-hour local weather forecasting.
- Proprietary Crop Health Index (CHI) helps in making informed farming decisions based on meteorological conditions.

### 4. 📜 Government Schemes Portal
- A comprehensive database of 35+ ongoing and upcoming agricultural schemes.
- Detailed views for individual schemes including eligibility criteria and application processes.

### 5. 🚜 Farming Tools
- Browse, buy, or rent agricultural machinery.
- Transparent hardware pricing paired with relevant government subsidy info.

---

## 🛠️ Tech Stack & Architecture

AgriConnect uses a decoupled monorepo architecture, splitting the frontend client and the AI backend service.

### Frontend Client (`/myreactapp`)
- **Core Library**: React 18 (Bootstrapped with Create React App)
- **Routing**: `react-router-dom` (v6) with Protected Route functionality for authenticated pages.
- **Styling**: Vanilla CSS featuring modern responsive UI, glassmorphism aesthetics, and tailored components (`Card`, `Navbar`, etc.).
- **HTTP Client**: `axios` for backend communication.
- **State Management**: React Context / Hooks (`useState`, `useEffect`, `useCallback`).

**Frontend Directory Structure:**
```text
myreactapp/
 ├── src/
 │   ├── components/  # Reusable UI widgets (Navbar, Footer, Chatbot, Card, etc.)
 │   ├── pages/       # Route-level components (Dashboard, CropPrices, Weather, etc.)
 │   ├── services/    # Authentication and Axios interceptors
 │   ├── styles/      # Global CSS and CSS design tokens
 │   └── App.js       # Main routing layout (includes ProtectedRoutes)
```

### Backend API (`/backend`)
- **Server**: Node.js & Express.js
- **Middleware**: `cors` (configured for frontend dev servers), `dotenv` for environment variables.
- **AI/ML Engine**: `@xenova/transformers` (Specifically, running custom NLP classification to parse and respond to queries securely on the local CPU).
- **Architecture Highlights**: Modular routing (`routes/chat.js`) separated from core ML logic (`services/mlService.js`).

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn package manager

### 1. Running the Backend Server
The backend handles the AI models. On the first run, it will download necessary ONNX weights for the NLP engine.
```bash
cd backend
npm install
# Start in development mode
npm run dev
# OR start normally
npm start
```
*The backend API will run on `http://localhost:5000`.*

### 2. Running the Frontend Application
In a separate terminal, deploy the React development server:
```bash
cd myreactapp
npm install
npm start
```
*The web interface will open at `http://localhost:3000`. If you aren't logged in, it will route you to the `/login` portal.*

---

## 🔐 Authentication Flow
- The application uses a custom authentication wrapper (`ProtectedRoute`).
- Unauthenticated users are strictly redirected to `/login`.
- Session state is managed via `authService.js`.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
