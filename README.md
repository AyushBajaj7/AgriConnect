# AgriConnect - Intelligent Agricultural Assistant

AgriConnect is a comprehensive full-stack platform designed to empower farmers with real-time data, AI-driven guidance, and critical agricultural resources. It features an intelligent Retrieval-Augmented Generation (RAG) chatbot capable of answering complex farming queries.

## 🌟 Features

- **🌾 Live Crop Prices**: Real-time market data across various states and mandis with filtering and trend indicators.
- **🛠️ Farming Tools**: Browse, buy, or rent agricultural machinery with transparent pricing and government subsidy info.
- **📜 Government Schemes**: A comprehensive, categorized database of 35+ ongoing and upcoming agricultural schemes.
- **🌤️ Local Weather & CHI**: 48-hour forecasts and a proprietary Crop Health Index (CHI) to guide farming decisions.
- **🤖 AgriBot (AI Assistant)**: A floating local AI chatbot powered by Xenova's Qwen 0.5B generative language model running directly inside your Node.js environment.

## 🏗️ Architecture

AgriConnect is built as a modern decouple monorepo:

### 1. Frontend (`/myreactapp`)
- **Framework**: React 18 (Create React App)
- **Routing**: React Router v6
- **Styling**: Pure CSS with responsive glassmorphism design
- **State**: React Hooks (useState, useEffect, useCallback)

### 2. Backend API (`/backend`)
- **Framework**: Node.js & Express
- **AI Integration**: `@xenova/transformers`
- **Generative AI**: `Xenova/Qwen1.5-0.5B-Chat` for fully local, CPU text generation.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```
*The backend runs on http://localhost:5000 and downloads the ONNX model files securely onto your local CPU on initial boot.*

### 2. Start the Frontend
```bash
cd myreactapp
npm install
npm start
```
*The React app runs on http://localhost:3000.*



## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
