import { Router } from "express";
import { userAuthMiddleware, authorizeRoles } from "../../middleware/auth.middleware.js";
import { domainAuthMiddleware } from "../../middleware/domainAuth.middleware.js";
import {
  getBotConfig,
  updateBotConfig,
  rotateBotKeys,
  getPublicWidgetConfig,
} from "./bot.controller.js";

const router = Router();

// Public widget configuration endpoint (secured by domain authentication)
router.get("/widget-config", domainAuthMiddleware, getPublicWidgetConfig);

// Protected company bot endpoints (OWNER and ADMIN only)
router.get("/", userAuthMiddleware, authorizeRoles("OWNER", "ADMIN"), getBotConfig);
router.put("/", userAuthMiddleware, authorizeRoles("OWNER", "ADMIN"), updateBotConfig);
router.post("/rotate-keys", userAuthMiddleware, authorizeRoles("OWNER", "ADMIN"), rotateBotKeys);

export default router;
