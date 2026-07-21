import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatOpenAI } from "@langchain/openai";
import { getEmbeddingsConfig, getQdrantConfig } from "../modules/knowledgeBase/services/qdrant.service.js";
import db from "../database/models/index.js";
import { dispatchWebhook } from "./webhook.service.js";

const { Conversation, ChatMessage, Ticket, UsageAnalytics } = db;

/**
 * Execute RAG Retrieval & LLM Generation Pipeline
 */
export const runRAGPipeline = async ({
  companyId,
  botId,
  userMessage,
  sessionId,
  confidenceThreshold = 0.5,
}) => {
  const embeddings = getEmbeddingsConfig();
  const qdrantConfig = getQdrantConfig();

  // 1. Initialize Qdrant Vector Store
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, qdrantConfig);

  // 2. Perform similarity search with metadata filter for companyId
  let searchResults = [];
  try {
    searchResults = await vectorStore.similaritySearchWithScore(userMessage, 4, {
      must: [
        {
          key: "metadata.companyId",
          match: { value: companyId },
        },
      ],
    });
  } catch (err) {
    console.warn("Similarity search warning:", err.message);
  }

  // Calculate highest similarity score
  let maxScore = 0;
  const contextPassages = searchResults.map(([doc, score]) => {
    if (score > maxScore) maxScore = score;
    return doc.pageContent;
  });

  const contextText = contextPassages.join("\n\n---\n\n");
  const isRagHit = searchResults.length > 0 && maxScore >= 0.4;
  const confidenceScore = isRagHit ? Math.min(1.0, parseFloat(maxScore.toFixed(2))) : 0.2;

  let answer = "";
  let requiresHumanHandoff = confidenceScore < confidenceThreshold;

  if (!isRagHit || requiresHumanHandoff) {
    answer = "I'm sorry, I don't have enough information in my knowledge base to answer this accurately. I've routed your request to a human support agent who will follow up with you shortly.";
  } else {
    // 3. Generate response using ChatOpenAI
    const apiKey = process.env.OPENAI_API_KEY || process.env.EMBEDDING_API_KEY;
    const model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: process.env.LLM_MODEL || "gpt-4o-mini",
      temperature: 0.3,
    });

    const systemPrompt = `You are an AI Customer Support Agent for this organization.
Use ONLY the following context to answer the user's question clearly, concisely, and accurately.
If the context does not contain the answer, politely state that you cannot answer based on the knowledge base and suggest connecting with a human agent.

Context:
${contextText}`;

    try {
      const response = await model.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ]);
      answer = response.content;
    } catch (err) {
      console.error("LLM Generation error:", err);
      answer = "An error occurred while generating the response. A human agent has been notified.";
      requiresHumanHandoff = true;
    }
  }

  // 4. Save Session & Chat History in PostgreSQL
  let conversation = null;
  if (Conversation && ChatMessage) {
    try {
      [conversation] = await Conversation.findOrCreate({
        where: { sessionId: sessionId || `session_${Date.now()}` },
        defaults: {
          companyId,
          status: requiresHumanHandoff ? "ESCALATED" : "OPEN",
          lastMessageAt: new Date(),
        },
      });

      await ChatMessage.create({
        conversationId: conversation.id,
        sender: "VISITOR",
        text: userMessage,
      });

      await ChatMessage.create({
        conversationId: conversation.id,
        sender: "BOT",
        text: answer,
        confidenceScore,
      });
    } catch (dbErr) {
      console.error("Failed to store chat history:", dbErr);
    }
  }

  // 5. Handle Human Escalation / Ticket Creation if required
  if (requiresHumanHandoff && Ticket && conversation) {
    try {
      await Ticket.create({
        companyId,
        conversationId: conversation.id,
        subject: `Escalated Chat: ${userMessage.slice(0, 50)}...`,
        description: `User asked: "${userMessage}"\nBot Confidence: ${confidenceScore}`,
        status: "OPEN",
        priority: "HIGH",
      });

      await dispatchWebhook({
        companyId,
        event: "human.handoff",
        payload: {
          sessionId,
          conversationId: conversation.id,
          userMessage,
          confidenceScore,
        },
      });
    } catch (ticketErr) {
      console.error("Failed to create escalated ticket:", ticketErr);
    }
  }

  // 6. Record Usage Analytics
  if (UsageAnalytics) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [analytics] = await UsageAnalytics.findOrCreate({
        where: { companyId, date: today },
        defaults: {
          companyId,
          date: today,
        },
      });

      await analytics.increment({
        totalQueries: 1,
        totalTokensUsed: Math.ceil(userMessage.length / 4) + Math.ceil(answer.length / 4),
        ragHits: isRagHit ? 1 : 0,
        humanEscalations: requiresHumanHandoff ? 1 : 0,
      });
    } catch (analyticErr) {
      console.error("Analytics recording error:", analyticErr);
    }
  }

  return {
    answer,
    confidenceScore,
    requiresHumanHandoff,
    sources: searchResults.map(([doc]) => ({
      documentId: doc.metadata.documentId,
      title: doc.metadata.title,
    })),
  };
};
