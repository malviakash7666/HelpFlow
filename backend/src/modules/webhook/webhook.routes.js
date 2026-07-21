import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getWebhooks,
  createWebhook,
  deleteWebhook,
} from "./webhook.controller.js";

const router = Router();

router.get("/", authMiddleware, getWebhooks);
router.post("/", authMiddleware, createWebhook);
router.delete("/:id", authMiddleware, deleteWebhook);

export default router;
