import axios from "axios";

/**
 * Generate embedding for a single text string using configured OpenAI-compatible API.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} The vector embedding (array of floats).
 */
export const generateEmbedding = async (text) => {
  const url = process.env.EMBEDDING_API_URL || "https://api.openai.com/v1";
  const apiKey = process.env.EMBEDDING_API_KEY;
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  if (!apiKey) {
    throw new Error("EMBEDDING_API_KEY is not configured in environment variables.");
  }

  try {
    const response = await axios.post(
      `${url}/embeddings`,
      {
        input: text.replace(/\n/g, " "), // recommended preprocessing
        model: model,
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.data?.[0]?.embedding) {
      return response.data.data[0].embedding;
    }
    throw new Error("Invalid embedding response structure.");
  } catch (error) {
    console.error("Embedding API Error:", error.response?.data || error.message);
    throw new Error(`Embedding generation failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Generate embeddings for an array of text strings in a batch.
 * @param {string[]} texts - Array of input text strings to embed.
 * @returns {Promise<number[][]>} Array of vector embeddings.
 */
export const generateEmbeddingsBatch = async (texts) => {
  if (!texts || texts.length === 0) return [];
  
  const url = process.env.EMBEDDING_API_URL || "https://api.openai.com/v1";
  const apiKey = process.env.EMBEDDING_API_KEY;
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  if (!apiKey) {
    throw new Error("EMBEDDING_API_KEY is not configured in environment variables.");
  }

  try {
    const response = await axios.post(
      `${url}/embeddings`,
      {
        input: texts.map((t) => t.replace(/\n/g, " ")),
        model: model,
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.data) {
      // Sort items by index to preserve input order
      const sorted = [...response.data.data].sort((a, b) => a.index - b.index);
      return sorted.map((item) => item.embedding);
    }
    throw new Error("Invalid embedding batch response structure.");
  } catch (error) {
    console.error("Batch Embedding API Error:", error.response?.data || error.message);
    throw new Error(`Batch embedding generation failed: ${error.response?.data?.error?.message || error.message}`);
  }
};
