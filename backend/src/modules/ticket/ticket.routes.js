import express from "express";
import { userAuthMiddleware } from "../../middleware/auth.middleware.js";
import {
  listTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  replyTicket,
  getDashboardStats,
  createTicket,
} from "./ticket.controller.js";

const router = express.Router();

// Apply user level authorization middleware to all ticket routes
router.use(userAuthMiddleware);

router.get("/dashboard-stats", getDashboardStats);
router.get("/", listTickets);
router.post("/", createTicket);
router.get("/:id", getTicketById);
router.post("/:id/assign", assignTicket);
router.post("/:id/status", updateTicketStatus);
router.post("/:id/reply", replyTicket);

export default router;
