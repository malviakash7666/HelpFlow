import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import axios from "axios";

/**
 * Configure OpenAI-compatible Embeddings via LangChain.
 */
export const getEmbeddingsConfig = () => {
  const apiKey = process.env.EMBEDDING_API_KEY;
  if (!apiKey) {
    throw new Error("EMBEDDING_API_KEY is not configured in environment variables.");
  }
  return new OpenAIEmbeddings({
    openAIApiKey: apiKey,
    configuration: {
      baseURL: process.env.EMBEDDING_API_URL || "https://api.openai.com/v1",
    },
    modelName: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  });
};

/**
 * Configure Qdrant vector store options.
 */
export const getQdrantConfig = () => {
  return {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION || "knowledge_base",
  };
};

/**
 * Check if the Qdrant collection exists on start, and if not, create it.
 */
export const initQdrant = async () => {
  const url = process.env.QDRANT_URL || "http://localhost:6333";
  const collection = process.env.QDRANT_COLLECTION || "knowledge_base";
  const headers = { "Content-Type": "application/json" };
  if (process.env.QDRANT_API_KEY) {
    headers["api-key"] = process.env.QDRANT_API_KEY;
  }

  const vectorSize = parseInt(process.env.EMBEDDING_DIMENSION || "1536", 10);

  console.log(`[LangChain Qdrant] Initializing collection: "${collection}" at ${url}...`);
  try {
    await axios.get(`${url}/collections/${collection}`, { headers });
    console.log(`[LangChain Qdrant] ✓ Collection "${collection}" already exists.`);
  } catch (err) {
    if (err.response?.status === 404) {
      console.log(`[LangChain Qdrant] Collection not found. Auto-creating...`);
      await axios.put(
        `${url}/collections/${collection}`,
        {
          vectors: {
            size: vectorSize,
            distance: "Cosine",
          },
        },
        { headers }
      );
      console.log(`[LangChain Qdrant] ✓ Collection "${collection}" created successfully.`);
    } else {
      console.error("[LangChain Qdrant] Failed to verify/create collection:", err.message);
      return;
    }
  }

  // Ensure metadata.documentId payload index exists for deleting points
  try {
    console.log(`[LangChain Qdrant] Ensuring payload index for "metadata.documentId"...`);
    await axios.put(
      `${url}/collections/${collection}/index`,
      {
        field_name: "metadata.documentId",
        field_schema: "keyword",
      },
      { headers }
    );
    console.log(`[LangChain Qdrant] ✓ Payload index for "metadata.documentId" is ready.`);
  } catch (err) {
    console.error("[LangChain Qdrant] Failed to create payload index for documentId:", err.message);
  }

  // Ensure metadata.companyId payload index exists for querying points
  try {
    console.log(`[LangChain Qdrant] Ensuring payload index for "metadata.companyId"...`);
    await axios.put(
      `${url}/collections/${collection}/index`,
      {
        field_name: "metadata.companyId",
        field_schema: "keyword",
      },
      { headers }
    );
    console.log(`[LangChain Qdrant] ✓ Payload index for "metadata.companyId" is ready.`);
  } catch (err) {
    console.error("[LangChain Qdrant] Failed to create payload index for companyId:", err.message);
  }
};

export const qdrantService = {
  /**
   * Delete points belonging to a specific document ID.
   * Uses native Qdrant REST delete for speed and robustness.
   */
  async deletePointsForDocument(documentId) {
    const url = process.env.QDRANT_URL || "http://localhost:6333";
    const collection = process.env.QDRANT_COLLECTION || "knowledge_base";
    const headers = { "Content-Type": "application/json" };
    if (process.env.QDRANT_API_KEY) {
      headers["api-key"] = process.env.QDRANT_API_KEY;
    }

    try {
      await axios.post(
        `${url}/collections/${collection}/points/delete`,
        {
          filter: {
            must: [
              {
                key: "metadata.documentId",
                match: {
                  value: documentId,
                },
              },
            ],
          },
        },
        { headers }
      );
      console.log(`[LangChain Qdrant] Deleted vectors for Document ID: ${documentId}`);
    } catch (error) {
      console.error(`[LangChain Qdrant] Failed to delete points for doc ${documentId}:`, error.message);
      throw new Error(`Qdrant deletion failed: ${error.message}`);
    }
  },
};
