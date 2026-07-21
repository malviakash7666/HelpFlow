import { Router } from "express";
import {
  registerCompany,
  loginCompany,
  logoutCompany,
  refreshAccessToken,
  getCompanyProfile,
  updateCompanyProfile,
  forgotPasswordCompany,
  resetPasswordCompany,
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
router.post("/forgot-password", forgotPasswordCompany);
router.post("/reset-password", resetPasswordCompany);

/**
 * Protected routes (require valid JWT Access Token)
 */
router.get("/profile", authMiddleware, getCompanyProfile);
router.put("/profile", authMiddleware, updateCompanyProfile);

export default router;
