import db from "../database/models/index.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import { getEmbeddingsConfig, getQdrantConfig } from "../modules/knowledgeBase/services/qdrant.service.js";
import { dispatchWebhook } from "../services/webhook.service.js";

const { Document } = db;

/**
 * Core job execution for processing documents into Qdrant vectors
 */
export const processDocumentJob = async (jobData) => {
  const { documentId, companyId, text, title } = jobData;
  console.log(`[Worker] Starting document processing for Doc ID: ${documentId} (Company: ${companyId})`);

  try {
    const documentRecord = await Document.findByPk(documentId);
    if (!documentRecord) {
      console.error(`[Worker] Document record ${documentId} not found.`);
      return;
    }

    await documentRecord.update({ status: "PROCESSING" });

    // 1. Chunk document text using RecursiveCharacterTextSplitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments(
      [text],
      [
        {
          documentId,
          companyId,
          title: title || documentRecord.title,
        },
      ]
    );

    // 2. Compute vectors & store into Qdrant
    const embeddings = getEmbeddingsConfig();
    const qdrantConfig = getQdrantConfig();

    await QdrantVectorStore.fromDocuments(docs, embeddings, qdrantConfig);

    // 3. Mark document as INDEXED
    await documentRecord.update({
      status: "INDEXED",
      chunkCount: docs.length,
    });

    console.log(`[Worker] Successfully indexed Doc ID: ${documentId} into Qdrant (${docs.length} chunks).`);

    // 4. Trigger Webhook event: document.uploaded
    await dispatchWebhook({
      companyId,
      event: "document.uploaded",
      payload: {
        documentId,
        title: documentRecord.title,
        status: "INDEXED",
        chunkCount: docs.length,
      },
    });
  } catch (err) {
    console.error(`[Worker] Error processing document ${documentId}:`, err);
    const documentRecord = await Document.findByPk(documentId);
    if (documentRecord) {
      await documentRecord.update({ status: "FAILED" });
    }
  }
};
