import express from "express";
import multer from "multer";
import path from "url";
import fs from "fs";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  uploadDocument,
  listDocuments,
  deleteDocument,
  reindexDocument,
  chat,
  getConversations,
  getConversationMessages,
} from "./knowledgeBase.controller.js";

// Ensure uploads directory exists
const UPLOADS_DIR = "./uploads";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter restricting uploads to PDF, DOCX, and TXT
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOCX, and TXT files are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

const router = express.Router();

// Apply authMiddleware to all routes (tenant isolation)
router.use(authMiddleware);

// Upload document
router.post("/upload", upload.single("file"), uploadDocument);

// Get list of documents
router.get("/documents", listDocuments);

// Delete document
router.delete("/documents/:id", deleteDocument);

// Re-index document
router.post("/reindex/:id", reindexDocument);

// Ask question RAG chat
router.post("/chat", chat);

// Get conversations list
router.get("/conversations", getConversations);

// Get messages for a specific conversation
router.get("/conversations/:id/messages", getConversationMessages);

// Error-handling middleware for multer upload errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      data: null,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      data: null,
    });
  }
  next();
});

export default router;
