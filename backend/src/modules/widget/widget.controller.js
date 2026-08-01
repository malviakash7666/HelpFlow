import { queryRAG } from "../knowledgeBase/knowledgeBase.service.js";
import db from "../../database/models/index.js";

const { Widget, Conversation, ChatMessage, Ticket, User, Company, Bot } = db;

/**
 * Assign a new support ticket to the active employee with the least load.
 */
const assignEmployeeForTicket = async (companyId) => {
  const employees = await User.findAll({
    where: { 
      companyId, 
      isActive: true,
      role: ["OWNER", "ADMIN", "SUPPORT_AGENT"]
    }
  });
  
  if (employees.length === 0) return null;

  const ticketCounts = await Promise.all(
    employees.map(async (emp) => {
      const count = await Ticket.count({
        where: {
          assignedEmployeeId: emp.id,
          status: ["OPEN", "ASSIGNED", "IN_PROGRESS"]
        }
      });
      return { employeeId: emp.id, count };
    })
  );

  ticketCounts.sort((a, b) => a.count - b.count);
  return ticketCounts[0].employeeId;
};

/**
 * Public chatbot communication RAG endpoint.
 * Validates companyId and widgetKey, then runs RAG pipeline.
 */
export const widgetChat = async (req, res) => {
  try {
    const { companyId, message, conversationId, widgetKey } = req.body;

    if (!companyId || !message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "companyId and message are required fields.",
        data: null,
      });
    }

    let resolvedCompanyId = companyId;
    let resolvedWidgetKey = widgetKey;

    // Check if the provided companyId is actually a Bot ID
    const bot = await Bot.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { id: companyId },
          { publicKey: widgetKey }
        ]
      }
    });

    if (bot) {
      resolvedCompanyId = bot.companyId;
      // Get the corresponding widget configuration for that company
      const companyWidget = await Widget.findOne({
        where: { companyId: resolvedCompanyId, isActive: true }
      });
      if (companyWidget) {
        resolvedWidgetKey = companyWidget.widgetKey;
      }
    }

    // 1. Validate widget exists and is active
    const widget = await Widget.findOne({
      where: { companyId: resolvedCompanyId, isActive: true },
    });

    if (!widget) {
      return res.status(403).json({
        success: false,
        message: "AI Widget is currently disabled or not configured for this company.",
        data: null,
      });
    }

    // 2. Validate widgetKey
    if (!resolvedWidgetKey || widget.widgetKey !== resolvedWidgetKey) {
      return res.status(401).json({
        success: false,
        message: "Invalid widget validation key.",
        data: null,
      });
    }

    // 3. Find or create conversation session
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        where: { id: conversationId, companyId: resolvedCompanyId },
      });
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Session expired or invalid.",
          data: null,
        });
      }
    } else {
      conversation = await Conversation.create({
        companyId: resolvedCompanyId,
        status: "active",
      });
    }

    // 4. Save visitor query
    await ChatMessage.create({
      conversationId: conversation.id,
      senderType: "visitor",
      content: message,
    });

    // 5. Run the RAG pipeline
    const result = await queryRAG(resolvedCompanyId, message);

    let ticketCreated = false;
    if (result.needHumanSupport) {
      // Prevent duplicate tickets for the same active session
      const existingTicket = await Ticket.findOne({
        where: { conversationId: conversation.id }
      });

      if (!existingTicket) {
        const company = await Company.findByPk(resolvedCompanyId);
        let assignedEmployeeId = null;
        if (company && company.autoAssignmentEnabled) {
          assignedEmployeeId = await assignEmployeeForTicket(resolvedCompanyId);
          if (!assignedEmployeeId) {
            assignedEmployeeId = company.fallbackEmployeeId || null;
          }
        }
        
        await Ticket.create({
          companyId: resolvedCompanyId,
          conversationId: conversation.id,
          subject: "AI Support Handoff - Unresolved Query",
          description: `Customer Query: "${message}"\n\nAI responded: "${result.answer}"`,
          priority: "HIGH",
          status: assignedEmployeeId ? "ASSIGNED" : "OPEN",
          assignedEmployeeId,
        });
        ticketCreated = true;
      }
    }

    // 6. Save bot response
    await ChatMessage.create({
      conversationId: conversation.id,
      senderType: "bot",
      content: result.answer,
    });

    return res.status(200).json({
      success: true,
      message: "AI reply generated.",
      data: {
        answer: result.answer,
        sources: result.sources || [],
        conversationId: conversation.id,
        needHumanSupport: !!result.needHumanSupport,
        ticketCreated,
      },
    });
  } catch (error) {
    console.error("Widget Chat Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during chatbot query.",
      data: null,
    });
  }
};

/**
 * Get or initialize widget config (private - authenticated).
 */
export const getWidgetConfig = async (req, res) => {
  try {
    let widget = await Widget.findOne({
      where: { companyId: req.company.id },
    });

    if (!widget) {
      // Auto-initialize a widget record if none exists
      widget = await Widget.create({
        companyId: req.company.id,
        isActive: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Widget config retrieved.",
      data: widget,
    });
  } catch (error) {
    console.error("Get Widget Config Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving widget configuration.",
      data: null,
    });
  }
};

/**
 * Enable/Disable the widget (private - authenticated).
 */
export const toggleWidget = async (req, res) => {
  try {
    const widget = await Widget.findOne({
      where: { companyId: req.company.id },
    });

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget configuration not found.",
        data: null,
      });
    }

    widget.isActive = !widget.isActive;
    await widget.save();

    return res.status(200).json({
      success: true,
      message: `Widget successfully ${widget.isActive ? "enabled" : "disabled"}.`,
      data: widget,
    });
  } catch (error) {
    console.error("Toggle Widget Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling widget status.",
      data: null,
    });
  }
};

/**
 * Regenerate widget secure key (private - authenticated).
 */
export const regenerateWidgetKey = async (req, res) => {
  try {
    const widget = await Widget.findOne({
      where: { companyId: req.company.id },
    });

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget configuration not found.",
        data: null,
      });
    }

    // Assigning defaultValue UUIDV4 triggers on create, let's generate one programmatically for updates
    import("crypto").then((crypto) => {
      // Note: we can generate UUID directly using crypto.randomUUID()
    });
    
    // Node.js crypto module has randomUUID() natively
    const { randomUUID } = await import("crypto");
    widget.widgetKey = randomUUID();
    await widget.save();

    return res.status(200).json({
      success: true,
      message: "Widget authorization key regenerated successfully.",
      data: widget,
    });
  } catch (error) {
    console.error("Regenerate Widget Key Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while regenerating widget key.",
      data: null,
    });
  }
};

/**
 * Public endpoint to retrieve message transcript for widget visitor.
 * Validates using widgetKey query parameter.
 */
export const getWidgetMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { widgetKey } = req.query;

    if (!id || !widgetKey) {
      return res.status(400).json({
        success: false,
        message: "conversationId and widgetKey are required query parameters.",
        data: null,
      });
    }

    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
        data: null,
      });
    }

    const widget = await Widget.findOne({
      where: { companyId: conversation.companyId, isActive: true },
    });

    let isKeyValid = false;
    if (widget && widget.widgetKey === widgetKey) {
      isKeyValid = true;
    } else {
      // Fallback: Check if the provided key is the bot's public key
      const bot = await Bot.findOne({
        where: { companyId: conversation.companyId, publicKey: widgetKey }
      });
      if (bot) {
        isKeyValid = true;
      }
    }

    if (!isKeyValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive widget validation key.",
        data: null,
      });
    }

    const messages = await ChatMessage.findAll({
      where: { conversationId: id },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Messages retrieved.",
      data: messages,
    });
  } catch (error) {
    console.error("Get Widget Messages Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving widget messages.",
      data: null,
    });
  }
};
