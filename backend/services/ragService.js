/**
 * File: services/ragService.js
 * Description: Retrieval-Augmented Generation (RAG) orchestration layer.
 *
 *   1. At server startup: loads all knowledge chunks, embeds them via Gemini
 *      text-embedding-004, stores vectors in memory (knowledgeStore[]).
 *   2. MD5-keyed disk cache (.embedding_cache.json) prevents re-embedding on
 *      every restart — embeddings are only re-computed when the text changes.
 *   3. At query time: embeds the user query and returns the top-K most
 *      semantically relevant knowledge chunks by cosine similarity.
 *
 * Architecture:
 *   server.js → initRAG() on startup
 *   routes/chat.js → retrieveContext(query) → top-K chunks → injected into Gemini prompt
 *
 * Knowledge base: 55 chunks across schemes, crops, tools, and general topics.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { getEmbedding, cosineSimilarity } = require("./embeddingService");

// Knowledge base files
const schemeChunks = require("../knowledge/schemes");
const cropChunks = require("../knowledge/crops");
const toolChunks = require("../knowledge/tools");
const generalChunks = require("../knowledge/general");

const ALL_CHUNKS = [
  ...schemeChunks,
  ...cropChunks,
  ...toolChunks,
  ...generalChunks,
];

/** Path to the disk cache (persists between restarts) */
const CACHE_FILE = path.join(__dirname, "../.embedding_cache.json");

/** In-memory vector store — loaded once at startup */
const knowledgeStore = []; // Array<{ text: string, embedding: number[] }>

/** Derive a stable cache key from chunk text */
const chunkKey = (text) => crypto.createHash("md5").update(text).digest("hex");

/**
 * Initialize RAG: embed all knowledge chunks once and store in memory.
 * Uses disk cache so restarts don't re-call the embedding API.
 * Call this once from server.js before the server starts listening.
 *
 * @returns {Promise<void>}
 */
async function initRAG() {
  // Load existing embedding cache from disk
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
      console.log(
        `[RAG] Loaded ${Object.keys(cache).length} cached embeddings`,
      );
    } catch {
      console.warn("[RAG] Cache file corrupted — re-embedding all chunks");
    }
  }

  let newEmbeddings = 0;

  for (const text of ALL_CHUNKS) {
    const key = chunkKey(text);

    if (cache[key]) {
      // Use cached embedding — no API call
      knowledgeStore.push({ text, embedding: cache[key] });
    } else {
      // Compute new embedding via Gemini API
      const embedding = await getEmbedding(text);
      cache[key] = embedding;
      knowledgeStore.push({ text, embedding });
      newEmbeddings++;

      // Small delay between API calls to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Persist updated cache to disk
  if (newEmbeddings > 0) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    console.log(`[RAG] Embedded ${newEmbeddings} new chunks → cache updated`);
  }

  console.log(`✅ RAG initialized — ${knowledgeStore.length} chunks ready`);
}

/**
 * Retrieve the top-K most relevant knowledge chunks for a given query.
 * Returns them as a single formatted context string ready for Gemini.
 *
 * @param {string} query — the user's question
 * @param {number} topK — number of chunks to retrieve (default: 3)
 * @param {number} minScore — minimum cosine similarity threshold (default: 0.5)
 * @returns {Promise<string>} — formatted context or empty string if nothing relevant
 */
async function retrieveContext(query, topK = 3, minScore = 0.5) {
  if (knowledgeStore.length === 0) {
    console.warn("[RAG] Knowledge store empty — RAG not initialized?");
    return "";
  }

  // Embed the query
  const queryEmbedding = await getEmbedding(query);

  // Score all chunks by cosine similarity to the query
  const scored = knowledgeStore.map((item) => ({
    text: item.text,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  // Sort descending, take top-K above threshold
  const topChunks = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((s) => s.score >= minScore);

  if (topChunks.length === 0) return "";

  // Format for Gemini prompt injection
  return topChunks
    .map((s, i) => `[Knowledge ${i + 1}]\n${s.text}`)
    .join("\n\n");
}

/** True once initRAG() has completed */
const isReady = () => knowledgeStore.length > 0;

module.exports = { initRAG, retrieveContext, isReady };
