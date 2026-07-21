import { Router } from "express";
import { userAuthMiddleware, authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  getSystemOverview,
  listCompaniesAdmin,
  getAuditLogsAdmin,
} from "./admin.controller.js";

const router = Router();

router.use(userAuthMiddleware);
router.use(authorizeRoles("OWNER", "ADMIN"));

router.get("/overview", getSystemOverview);
router.get("/companies", listCompaniesAdmin);
router.get("/logs", getAuditLogsAdmin);

export default router;
