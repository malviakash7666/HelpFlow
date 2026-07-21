import { Router } from "express";
import {
  registerCompany,
  loginCompany,
  logoutCompany,
  refreshAccessToken,
  getCompanyProfile,
  updateCompanyProfile,
} from "./company.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

/**
 * Public routes
 */
router.post("/register", registerCompany);
router.post("/login", loginCompany);
router.post("/logout", logoutCompany);
router.post("/refresh-token", refreshAccessToken);

/**
 * Protected routes (require valid JWT Access Token)
 */
router.get("/profile", authMiddleware, getCompanyProfile);
router.put("/profile", authMiddleware, updateCompanyProfile);

export default router;
