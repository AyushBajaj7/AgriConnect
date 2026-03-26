# AgriConnect - Intelligent Agricultural Assistant

AgriConnect is a comprehensive full-stack platform designed to empower farmers with real-time data, AI-driven guidance, and critical agricultural resources. It features an intelligent Retrieval-Augmented Generation (RAG) chatbot capable of answering complex farming queries.

## 🌟 Features

- **🌾 Live Crop Prices**: Real-time market data across various states and mandis with filtering and trend indicators.
- **🛠️ Farming Tools**: Browse, buy, or rent agricultural machinery with transparent pricing and government subsidy info.
- **📜 Government Schemes**: A comprehensive, categorized database of 35+ ongoing and upcoming agricultural schemes.
- **🌤️ Local Weather & CHI**: 48-hour forecasts and a proprietary Crop Health Index (CHI) to guide farming decisions.
- **🤖 AgriBot (AI Assistant)**: A floating RAG-based chatbot powered by Gemini 2.0 Flash. It uses a custom 56-chunk knowledge base to provide cited, highly accurate answers regarding schemes, crops, and tools.

## 🏗️ Architecture

AgriConnect is built as a modern decouple monorepo:

### 1. Frontend (`/myreactapp`)
- **Framework**: React 18 (Create React App)
- **Routing**: React Router v6
- **Styling**: Pure CSS with responsive glassmorphism design
- **State**: React Hooks (useState, useEffect, useCallback)

### 2. Backend API (`/backend`)
- **Framework**: Node.js & Express
- **AI Integration**: `@google/generative-ai` SDK
- **RAG Pipeline**:
  - `gemini-embedding-001` (768-dimension vectors)
  - In-memory cosine similarity search
  - Local MD5 disk caching (`.embedding_cache.json`) to prevent redundant API calls
- **Resilience**: Custom exponential backoff retry mechanism for API rate limits.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Start the Backend
```bash
cd backend
npm install
# Create a .env file and add your GEMINI_API_KEY
echo "GEMINI_API_KEY=your_api_key_here" > .env
node server.js
```
*The backend runs on http://localhost:5000 and initializes the RAG knowledge base on boot.*

### 2. Start the Frontend
```bash
cd myreactapp
npm install
npm start
```
*The React app runs on http://localhost:3000.*

## 🌐 Deployment

The project is pre-configured for deployment on **Vercel**.
- **Frontend**: Import `/myreactapp` directly as a Create React App project.
- **Backend API**: Import `/backend` directly. It uses the included `vercel.json` to deploy as global Serverless Functions. Set the `GEMINI_API_KEY` environment variable in Vercel.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
