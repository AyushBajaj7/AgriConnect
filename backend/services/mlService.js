/**
 * File: services/mlService.js
 * Description: True Generative AI using Hugging Face Transformers.
 *              Downloads and runs a small, optimized LLM (Qwen 0.5B Chat) locally.
 */

let generator = null;

/**
 * Initializes the generative ML model by dynamically importing `@xenova/transformers`.
 * (Dynamic import ensures we don't block process initialization with large WASM loads).
 */
async function initML() {
  console.log("🧠 Initializing Local Generative AI (Qwen1.5-0.5B)...");
  
  try {
    const { pipeline, env } = await import("@xenova/transformers");
    
    // We don't want local caching issues since we delete old caches frequently
    env.allowLocalModels = true;
    
    // Download and load model (Takes a few seconds/minutes the first time)
    generator = await pipeline("text-generation", "Xenova/Qwen1.5-0.5B-Chat", {
      quantized: true,
    });
    console.log("✅ Generative Model Loaded into CPU Memory!");
  } catch (err) {
    console.error("❌ Failed to initialize generative pipeline:", err);
  }
}

/**
 * Asynchronous inference: generates a brand new sentence by predicting tokens.
 * @param {string} query 
 * @returns {Promise<string>} 
 */
async function getResponse(query) {
  if (!generator) return "Still downloading or loading the 500MB AI model into memory. Please wait a moment and try again.";

  // Format prompt using Qwen Chat Template
  const prompt = `<|im_start|>system\nYou are AgriBot, an intelligent and extremely helpful agricultural assistant. Answer questions clearly but keep your responses under 3 sentences to save CPU cycles.<|im_end|>\n<|im_start|>user\n${query}<|im_end|>\n<|im_start|>assistant\n`;

  console.log(`[GenerativeAI] Thinking... Query: "${query}"`);

  try {
    const output = await generator(prompt, {
      max_new_tokens: 100, // Keep short so CPU doesn't hang forever
      temperature: 0.7,
      do_sample: true,
      repetition_penalty: 1.1
    });

    let fullText = output[0].generated_text;
    
    // The model's decoder strips special tokens like <|im_start|>, so we split by "assistant\n"
    let responseText = fullText;
    if (responseText.includes("<|im_start|>assistant\n")) {
       responseText = responseText.split("<|im_start|>assistant\n").pop();
    } else if (responseText.includes("\nassistant\n")) {
       responseText = responseText.split("\nassistant\n").pop();
    }
    
    return responseText.trim();
  } catch (err) {
    console.error("Generative Inference Error:", err);
    return "I ran out of memory or encountered an error while typing. Sorry!";
  }
}

module.exports = { initML, getResponse };
