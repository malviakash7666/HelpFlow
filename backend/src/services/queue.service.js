import { Queue, Worker } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

let documentQueue = null;

try {
  documentQueue = new Queue("document-ingestion", { connection });
  console.log("⚡ BullMQ Queue 'document-ingestion' initialized.");
} catch (err) {
  console.warn("⚠️ Redis not connected for BullMQ, running in fallback mode:", err.message);
}

export const enqueueDocumentProcessing = async (data) => {
  if (documentQueue) {
    try {
      await documentQueue.add("process-document", data);
      return { queued: true, message: "Document added to processing queue." };
    } catch (err) {
      console.warn("Falling back to direct async processing due to Redis error:", err.message);
    }
  }

  // Fallback direct execution if Redis is not running
  const { processDocumentJob } = await import("../workers/documentProcessor.worker.js");
  setTimeout(() => processDocumentJob(data), 100);
  return { queued: true, message: "Document scheduled for processing." };
};

export { documentQueue, connection };
