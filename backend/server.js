/**
 * File: server.js
 * Description: AgriConnect backend entry point.
 *              Initializes RAG knowledge base on startup, then mounts Express
 *              routes. CORS allows the React dev server (port 3000/3003).
 *
 * Startup sequence:
 *   1. Load .env
 *   2. initRAG() — embed 55 knowledge chunks (uses disk cache after first run)
 *   3. Start listening on PORT (default 5000)
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const chatRoutes = require('./routes/chat');
const { initRAG } = require('./services/ragService');

const app  = express();
const PORT = process.env.PORT ?? 5000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:  ['http://localhost:3000', 'http://localhost:3003'],
  methods: ['POST', 'GET'],
}));
app.use(express.json({ limit: '10kb' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', chatRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AgriConnect AI Backend (RAG)' });
});

// ── Boot: Initialize RAG before accepting requests ───────────────────────────
async function startServer() {
  try {
    console.log('🌱 Initializing AgriConnect RAG knowledge base...');
    await initRAG(); // Embeds 55 chunks (or loads from .embedding_cache.json)

    app.listen(PORT, () => {
      console.log(`✅ AgriConnect backend running on http://localhost:${PORT}`);
      console.log(`   POST http://localhost:${PORT}/api/chat`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// If running locally, start server normally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  startServer();
} else {
  // If running in Vercel serverless environment, RAG is lazy-loaded on first request
  app.use(async (req, res, next) => {
    try {
      if (!isReady()) {
        console.log('🌱 Lazy-initializing RAG for Serverless...');
        await initRAG();
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to initialize RAG backend' });
    }
  });
}

// Export the express app for Vercel
module.exports = app;

