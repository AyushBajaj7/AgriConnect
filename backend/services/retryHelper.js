/**
 * File: services/retryHelper.js
 * Description: Exponential backoff retry wrapper for Gemini API calls.
 *              Gemini free tier limits: ~15 RPM for generation, ~1500/day.
 *              When a 429 is received, waits and retries automatically
 *              instead of immediately failing the user request.
 * Used in: geminiService.js, ragService.js (via retrieveContext)
 */

/**
 * Runs an async function with exponential backoff on 429 / RESOURCE_EXHAUSTED errors.
 *
 * @param {() => Promise<T>} fn - The async call to retry
 * @param {number} maxRetries   - Max number of retries (default: 3)
 * @param {number} baseDelayMs  - Initial wait in ms, doubles each retry (default: 5000)
 * @returns {Promise<T>}
 */
async function withRetry(fn, maxRetries = 3, baseDelayMs = 5000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.toLowerCase().includes('resource_exhausted') ||
        err?.message?.toLowerCase().includes('quota');

      if (!isRateLimit || attempt === maxRetries) throw err;

      const waitMs = baseDelayMs * Math.pow(2, attempt); // 5s, 10s, 20s
      console.warn(`[Retry] Rate limit hit — waiting ${waitMs / 1000}s before attempt ${attempt + 2}/${maxRetries + 1}`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  throw lastError;
}

module.exports = { withRetry };
