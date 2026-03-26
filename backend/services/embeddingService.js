/**
 * File: services/embeddingService.js
 * Description: Wraps Gemini embedding-001 API (768-dim vectors).
 *              Provides getEmbedding() and cosineSimilarity(). Used by ragService.js.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-embedding-001: confirmed available by ListModels API for this key
// (embedding-001 and text-embedding-004 both return 404 on v1beta SDK)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

const { withRetry } = require('./retryHelper');

/**
 * Converts text into a 768-dimension embedding vector.
 * Retries automatically on 429 rate-limit errors.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function getEmbedding(text) {
  const result = await withRetry(() => embeddingModel.embedContent(text));
  return result.embedding.values;
}

/**
 * Cosine similarity between two vectors. Returns [-1, 1].
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dot / magnitude;
}

module.exports = { getEmbedding, cosineSimilarity };
