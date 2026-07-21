import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { domainAuthMiddleware } from "../../middleware/domainAuth.middleware.js";
import {
  widgetChat,
  getWidgetConfig,
  toggleWidget,
  regenerateWidgetKey,
  getWidgetMessages,
} from "./widget.controller.js";

const router = express.Router();

// Public chatbot endpoint called by embed widget (secured by domain authentication)
router.post("/chat", domainAuthMiddleware, widgetChat);
router.get("/conversations/:id/messages", getWidgetMessages);

// Dashboard routes (require company authentication)
router.get("/config", authMiddleware, getWidgetConfig);
router.post("/config/toggle", authMiddleware, toggleWidget);
router.post("/config/regenerate", authMiddleware, regenerateWidgetKey);

export default router;
