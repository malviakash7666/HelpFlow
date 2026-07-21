import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatGroq } from "@langchain/groq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document as LangChainDocument } from "@langchain/core/documents";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import db from "../../database/models/index.js";
import { extractText } from "../../utils/textExtractor.js";
import { getEmbeddingsConfig, getQdrantConfig } from "./services/qdrant.service.js";

const { Document } = db;

/**
 * Run document text extraction and vector database ingestion in the background.
 * Uses LangChain splitter and Qdrant store.
 * @param {string} documentId - UUID of the document in PostgreSQL.
 */
export const processDocumentBackground = async (documentId) => {
  console.log(`[LangChain RAG] Ingestion started for Document: ${documentId}`);
  let doc;
  try {
    doc = await Document.findByPk(documentId);
    if (!doc) {
      console.error(`[LangChain RAG] Ingestion aborted: Document ${documentId} not found.`);
      return;
    }

    // Update status to PROCESSING
    doc.processingStatus = "PROCESSING";
    doc.error = null;
    await doc.save();

    // 1. Extract Text
    console.log(`[LangChain RAG] Extracting text for: ${doc.originalName}`);
    let localPath = doc.storagePath;
    let tempFileCreated = false;

    if (doc.storagePath.startsWith("http://") || doc.storagePath.startsWith("https://")) {
      console.log(`[LangChain RAG] File is remote, downloading from URL: ${doc.storagePath}`);
      const tempFilename = `temp-${Date.now()}-${doc.id}${path.extname(doc.originalName) || ''}`;
      // Ensure ./uploads exists
      await fs.mkdir("./uploads", { recursive: true });
      localPath = path.join("./uploads", tempFilename);
      
      const response = await axios.get(doc.storagePath, { responseType: 'arraybuffer' });
      await fs.writeFile(localPath, response.data);
      tempFileCreated = true;
    }

    const text = await extractText(localPath, doc.mimeType);

    // Clean up temporary local file if downloaded from Cloudinary
    if (tempFileCreated) {
      try {
        await fs.unlink(localPath);
      } catch (unlinkErr) {
        console.warn(`[LangChain RAG] Failed to delete temporary file ${localPath}:`, unlinkErr);
      }
    }

    if (!text || text.trim().length === 0) {
      throw new Error("No text content could be extracted from the file.");
    }

    // 2. LangChain Recursive Chunker
    console.log(`[LangChain RAG] Splitting text. Total length: ${text.length} chars`);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await splitter.splitText(text);
    console.log(`[LangChain RAG] Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error("Split resulted in zero text chunks.");
    }

    // 3. Prepare LangChain Documents with Metadata
    const documents = chunks.map((chunk) => {
      return new LangChainDocument({
        pageContent: chunk,
        metadata: {
          companyId: doc.companyId,
          documentId: doc.id,
          originalName: doc.originalName,
        },
      });
    });

    // 4. Get vector store connection and upload
    const embeddings = getEmbeddingsConfig();
    const qdrantConfig = getQdrantConfig();

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, qdrantConfig);
    
    console.log(`[LangChain RAG] Upserting documents to Qdrant collection...`);
    await vectorStore.addDocuments(documents);

    // Update status to COMPLETED
    doc.processingStatus = "COMPLETED";
    await doc.save();
    console.log(`[LangChain RAG] ✓ Document ingestion completed successfully: ${doc.originalName}`);
  } catch (err) {
    console.error(`[LangChain RAG] ❌ Document ingestion failed for ${documentId}:`, err);
    if (doc) {
      doc.processingStatus = "FAILED";
      doc.error = err.message || "An unexpected error occurred during processing.";
      await doc.save();
    }
  }
};

/**
 * Handle user question RAG pipeline using LangChain vector search and Groq.
 * @param {string} companyId - UUID of the requesting company.
 * @param {string} question - Question query from user.
 * @returns {Promise<Object>} Object containing generated answer and sources: { answer, sources: [] }
 */
export const queryRAG = async (companyId, question) => {
  // 1. Connect to Qdrant VectorStore
  const embeddings = getEmbeddingsConfig();
  const qdrantConfig = getQdrantConfig();

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, qdrantConfig);

  // 2. Similarity search with score (filtered strictly by companyId)
  console.log(`[LangChain RAG] Querying vector space for: "${question}"`);
  const results = await vectorStore.similaritySearchWithScore(question, 5, {
    must: [
      {
        key: "metadata.companyId",
        match: {
          value: companyId,
        },
      },
    ],
  });

  if (!results || results.length === 0) {
    return {
      answer: "I am unable to find this information. I will connect you with our support team.",
      needHumanSupport: true,
      sources: [],
    };
  }

  // 3. Aggregate contexts and source documents
  const contexts = [];
  const sourceDocsMap = new Map();

  for (const [langDoc, score] of results) {
    if (langDoc.pageContent) {
      contexts.push(langDoc.pageContent);
      const meta = langDoc.metadata;
      if (meta && meta.documentId) {
        sourceDocsMap.set(meta.documentId, {
          id: meta.documentId,
          originalName: meta.originalName || "Unnamed Document",
          score: score,
        });
      }
    }
  }

  const contextBlock = contexts.join("\n\n---\n\n");
  const sources = Array.from(sourceDocsMap.values());

  // 4. Groq Chat Model via LangChain
  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!groqKey) {
    throw new Error("GROQ_API_KEY is not configured in environment variables.");
  }

  const chatModel = new ChatGroq({
    apiKey: groqKey,
    model: groqModel,
    temperature: 0.1, // low temperature to prevent hallucination
  });

  const systemPrompt = `You are a helpful and professional customer support AI assistant.
Your task is to answer the user's question using ONLY the provided document context.

Strict Rules:
1. Rely ONLY on the clear facts mentioned in the context.
2. Never invent or extrapolate facts, or use external knowledge not contained in the context.
3. If the context does not contain the answer, respond politely saying: "I am sorry, but I cannot find that information in the uploaded company documents."
4. Keep your answer professional, clear, and direct. Do not mention "based on the context" or "according to the document". Just answer directly.

Context:
---
${contextBlock}
---`;

  try {
    const response = await chatModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(question),
    ]);

    const rawAnswer = response.content;
    if (!rawAnswer) {
      throw new Error("Empty response returned from ChatGroq model.");
    }

    const answer = typeof rawAnswer === "string" ? rawAnswer : JSON.stringify(rawAnswer);

    // Check if LLM determined the context was insufficient to answer
    if (
      answer.includes("cannot find that information") ||
      answer.includes("I am sorry, but I cannot find") ||
      answer.includes("uploaded company documents")
    ) {
      return {
        answer: "I am unable to find this information. I will connect you with our support team.",
        needHumanSupport: true,
        sources,
      };
    }

    return {
      answer,
      sources,
    };
  } catch (error) {
    console.error("[LangChain RAG] Chat model execution error:", error.message);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};
