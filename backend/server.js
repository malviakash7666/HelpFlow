import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import db from "./src/database/models/index.js";
import path from "path";
import companyRoutes from "./src/modules/company/company.routes.js";
import userRoutes from "./src/modules/user/user.routes.js";
import knowledgeBaseRoutes from "./src/modules/knowledgeBase/knowledgeBase.routes.js";
import widgetRoutes from "./src/modules/widget/widget.routes.js";
import ticketRoutes from "./src/modules/ticket/ticket.routes.js";
import botRoutes from "./src/modules/bot/bot.routes.js";
import adminRoutes from "./src/modules/admin/admin.routes.js";
import webhookRoutes from "./src/modules/webhook/webhook.routes.js";
import { initQdrant } from "./src/modules/knowledgeBase/services/qdrant.service.js";

dotenv.config();

const app = express();

// CORS configuration supporting credentials (cookies) in cross-port environments
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        process.env.NODE_ENV !== "production";
                        
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// JSON Body Parser
app.use(express.json());

// URL Encoded Data Parser
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Serve static files for the chat widget
app.use("/widget", express.static(path.resolve("src/widget")));

// Mount API routes
app.use("/api/company", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/knowledge-base", knowledgeBaseRoutes);
app.use("/api/widget", widgetRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/bots", botRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running 🚀",
  });
});

// Global Error Handler Middleware
// Catches parsing errors (e.g. invalid JSON) and other unexpected failures
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body. Please verify your syntax.",
      data: null,
    });
  }
  
  console.error("Unhandled Server Error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error.",
    data: null,
  });
});

const ensureSchemaUpToDate = async (sequelize) => {
  try {
    // 1. Sync models to automatically create any missing tables (bots, webhooks, audit_logs, usage_analytics)
    await sequelize.sync();
    console.log("📂 Synced model tables successfully.");

    const queryInterface = sequelize.getQueryInterface();

    // Check users table columns
    const userTableDescription = await queryInterface.describeTable("users");
    if (!userTableDescription.phone) {
      console.log("Adding 'phone' column to 'users' table...");
      await queryInterface.addColumn("users", "phone", {
        type: sequelize.Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!userTableDescription.location) {
      console.log("Adding 'location' column to 'users' table...");
      await queryInterface.addColumn("users", "location", {
        type: sequelize.Sequelize.STRING,
        allowNull: true,
      });
    }

    // Check companies table columns
    const companyTableDescription = await queryInterface.describeTable("companies");
    if (!companyTableDescription.autoAssignmentEnabled) {
      console.log("Adding 'autoAssignmentEnabled' column to 'companies' table...");
      await queryInterface.addColumn("companies", "autoAssignmentEnabled", {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }
    if (!companyTableDescription.assignmentMethod) {
      console.log("Adding 'assignmentMethod' column to 'companies' table...");
      await queryInterface.addColumn("companies", "assignmentMethod", {
        type: sequelize.Sequelize.STRING,
        defaultValue: "ROUND_ROBIN",
      });
    }
    if (!companyTableDescription.assignTo) {
      console.log("Adding 'assignTo' column to 'companies' table...");
      await queryInterface.addColumn("companies", "assignTo", {
        type: sequelize.Sequelize.STRING,
        defaultValue: "ALL_ACTIVE",
      });
    }
    if (!companyTableDescription.fallbackEmployeeId) {
      console.log("Adding 'fallbackEmployeeId' column to 'companies' table...");
      await queryInterface.addColumn("companies", "fallbackEmployeeId", {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
      });
    }

    // Check tickets table columns
    const ticketTableDescription = await queryInterface.describeTable("tickets");
    if (ticketTableDescription.customerId && ticketTableDescription.customerId.type !== "UUID") {
      console.log("Altering 'customerId' column in 'tickets' table to be UUID...");
      await sequelize.query('ALTER TABLE tickets ALTER COLUMN "customerId" TYPE uuid USING "customerId"::uuid;');
    }

    console.log("✅ Database schema is up to date.");
  } catch (error) {
    console.error("❌ Error ensuring schema is up to date:", error);
  }
};

// Database Connection & Server Start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log("📂 Database connection verified successfully.");

    // Sync database schema columns dynamically
    await ensureSchemaUpToDate(db.sequelize);

    // Initialize Qdrant collection on startup
    await initQdrant();

    const server = app.listen(PORT, () => {
      console.log("--------------------------------");
      console.log(`🚀 Server started successfully`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌱 Environment: ${process.env.NODE_ENV}`);
      console.log("--------------------------------");
    });

    process.on("SIGINT", () => {
      server.close(() => {
        console.log("--------------------------------");
        console.log("🛑 Server closed successfully");
        console.log("--------------------------------");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Unable to start server: Database connection failed.", error);
    process.exit(1);
  }
};

startServer();
