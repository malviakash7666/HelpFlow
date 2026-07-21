import fs from "fs/promises";
import path from "path";
import db from "../../database/models/index.js";
import { processDocumentBackground, queryRAG } from "./knowledgeBase.service.js";
import { qdrantService } from "./services/qdrant.service.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

const { Document, Conversation, ChatMessage } = db;

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document file provided. Please upload a PDF, DOCX, or TXT file.",
        data: null,
      });
    }

    const { originalname, path: localPath, size, mimetype } = req.file;

    // 1. Upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary(localPath, originalname);
    } catch (uploadErr) {
      // Clean up local temp file
      try {
        await fs.unlink(localPath);
      } catch (err) {
        console.warn("Failed to delete local temp file after Cloudinary error:", err);
      }
      return res.status(400).json({
        success: false,
        message: `Cloudinary upload failed: ${uploadErr.message}`,
        data: null,
      });
    }

    // 2. Clean up local temp file since it is now safely stored on Cloudinary
    try {
      await fs.unlink(localPath);
    } catch (err) {
      console.warn("Failed to delete local temp file:", err);
    }

    // 3. Create Document record in PostgreSQL using Cloudinary secure URL
    const doc = await Document.create({
      originalName: originalname,
      storagePath: uploadResult.secure_url,
      companyId: req.company.id,
      fileSize: size,
      mimeType: mimetype,
      processingStatus: "PENDING",
    });

    // Run processing pipeline asynchronously in the background
    processDocumentBackground(doc.id).catch((err) => {
      console.error(`Unhandled background processing error for doc ${doc.id}:`, err);
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully to Cloudinary and queued for processing.",
      data: {
        id: doc.id,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        processingStatus: doc.processingStatus,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload Document Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while uploading document.",
      data: null,
    });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: { companyId: req.company.id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Documents list retrieved successfully.",
      data: documents,
    });
  } catch (error) {
    console.error("List Documents Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving documents.",
      data: null,
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Document.findOne({
      where: { id, companyId: req.company.id },
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied.",
        data: null,
      });
    }

    // 1. Delete points from Qdrant vector database
    try {
      await qdrantService.deletePointsForDocument(doc.id);
    } catch (vectorErr) {
      console.error(`Failed to delete Qdrant points for document ${doc.id}:`, vectorErr);
      // Proceed with local deletion even if Qdrant points deletion fails (or keep sync)
    }

    // 2. Delete file from Cloudinary (if remote) or local uploads directory (if local)
    if (doc.storagePath.startsWith("http://") || doc.storagePath.startsWith("https://")) {
      try {
        const parts = doc.storagePath.split("/");
        const uploadIdx = parts.indexOf("upload");
        if (uploadIdx !== -1) {
          const nextPart = parts[uploadIdx + 1];
          const hasVersion = /^v\d+$/.test(nextPart);
          const startIdx = hasVersion ? uploadIdx + 2 : uploadIdx + 1;
          const publicIdWithExt = parts.slice(startIdx).join("/");
          
          await cloudinary.uploader.destroy(publicIdWithExt, { resource_type: "raw" });
          console.log(`[Cloudinary] Successfully deleted raw resource: ${publicIdWithExt}`);
        }
      } catch (cloudErr) {
        console.error(`[Cloudinary] Failed to delete document from Cloudinary:`, cloudErr);
      }
    } else {
      try {
        await fs.unlink(doc.storagePath);
      } catch (fileErr) {
        console.warn(`Local file not found for deletion: ${doc.storagePath}`);
      }
    }

    // 3. Delete Document record from PostgreSQL
    await doc.destroy();

    return res.status(200).json({
      success: true,
      message: "Document and its vector indices deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Document Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting document.",
      data: null,
    });
  }
};

export const reindexDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Document.findOne({
      where: { id, companyId: req.company.id },
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied.",
        data: null,
      });
    }

    // Reset status to PENDING
    doc.processingStatus = "PENDING";
    doc.error = null;
    await doc.save();

    // 1. Wipe old points from Qdrant first to avoid duplicates
    try {
      await qdrantService.deletePointsForDocument(doc.id);
    } catch (err) {
      console.warn(`Could not clear old vectors before reindexing doc ${doc.id}:`, err);
    }

    // 2. Start processing in background
    processDocumentBackground(doc.id).catch((err) => {
      console.error(`Unhandled background re-processing error for doc ${doc.id}:`, err);
    });

    return res.status(200).json({
      success: true,
      message: "Document re-indexing triggered successfully.",
      data: doc,
    });
  } catch (error) {
    console.error("Reindex Document Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while triggering document reindex.",
      data: null,
    });
  }
};

export const chat = async (req, res) => {
  try {
    const { question, conversationId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Question is required and cannot be empty.",
        data: null,
      });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        where: { id: conversationId, companyId: req.company.id },
      });
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or access denied.",
          data: null,
        });
      }
    } else {
      // Create new conversation
      conversation = await Conversation.create({
        companyId: req.company.id,
        status: "active",
      });
    }

    // 1. Save visitor message
    await ChatMessage.create({
      conversationId: conversation.id,
      senderType: "visitor",
      content: question,
    });

    // 2. Run the query through the RAG pipeline
    const result = await queryRAG(req.company.id, question);

    // 3. Save bot message
    await ChatMessage.create({
      conversationId: conversation.id,
      senderType: "bot",
      content: result.answer,
    });

    return res.status(200).json({
      success: true,
      message: "AI response generated successfully.",
      data: {
        ...result,
        conversationId: conversation.id,
      },
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during chat query.",
      data: null,
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: { companyId: req.company.id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Conversations list retrieved successfully.",
      data: conversations,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving conversations.",
      data: null,
    });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify conversation belongs to company
    const conversation = await Conversation.findOne({
      where: { id, companyId: req.company.id },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied.",
        data: null,
      });
    }

    const messages = await ChatMessage.findAll({
      where: { conversationId: id },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Conversation messages retrieved successfully.",
      data: messages,
    });
  } catch (error) {
    console.error("Get Conversation Messages Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving messages.",
      data: null,
    });
  }
};
