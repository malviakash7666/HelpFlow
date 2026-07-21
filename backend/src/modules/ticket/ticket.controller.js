import db from "../../database/models/index.js";

const { Ticket, Conversation, ChatMessage, User } = db;

/**
 * List all tickets for the employee's company.
 */
export const listTickets = async (req, res) => {
  try {
    const whereClause = { companyId: req.user.companyId };

    // Support agents only see tickets assigned to them
    if (req.user.role === "SUPPORT_AGENT") {
      whereClause.assignedEmployeeId = req.user.id;
    }

    const tickets = await Ticket.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "assignedEmployee",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "email", "phone", "location"],
        },
        {
          model: Conversation,
          as: "conversation",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Tickets retrieved successfully.",
      data: tickets,
    });
  } catch (error) {
    console.error("List Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while listing tickets.",
      data: null,
    });
  }
};

/**
 * Get ticket details by ID.
 */
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const whereClause = { id, companyId: req.user.companyId };

    if (req.user.role === "SUPPORT_AGENT") {
      whereClause.assignedEmployeeId = req.user.id;
    }

    const ticket = await Ticket.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: "assignedEmployee",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "email", "phone", "location"],
        },
        {
          model: Conversation,
          as: "conversation",
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found or access denied.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket details retrieved successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Get Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching ticket details.",
      data: null,
    });
  }
};

/**
 * Assign a ticket to an employee.
 * Defaults to the logged-in user if no employeeId is specified.
 */
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedEmployeeId } = req.body;

    const ticket = await Ticket.findOne({
      where: { id, companyId: req.user.companyId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
        data: null,
      });
    }

    // Default to the current authenticated employee if none specified
    const targetEmployeeId = assignedEmployeeId || req.user.id;

    // Verify employee belongs to company and is active
    const employee = await User.findOne({
      where: { id: targetEmployeeId, companyId: req.user.companyId, isActive: true },
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Target employee not found or inactive in this company.",
        data: null,
      });
    }

    ticket.assignedEmployeeId = targetEmployeeId;
    ticket.status = "ASSIGNED";
    await ticket.save();

    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [{ model: User, as: "assignedEmployee", attributes: ["id", "name", "email"] }],
    });

    return res.status(200).json({
      success: true,
      message: "Ticket assigned successfully.",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Assign Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while assigning ticket.",
      data: null,
    });
  }
};

/**
 * Update ticket status.
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status value.",
        data: null,
      });
    }

    const ticket = await Ticket.findOne({
      where: { id, companyId: req.user.companyId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
        data: null,
      });
    }

    ticket.status = status;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Update Ticket Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating ticket status.",
      data: null,
    });
  }
};

/**
 * Employee replies to the customer.
 * Inserts the reply into the ChatMessages table using the conversationId.
 */
export const replyTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply content cannot be empty.",
        data: null,
      });
    }

    const ticket = await Ticket.findOne({
      where: { id, companyId: req.user.companyId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
        data: null,
      });
    }

    // 1. Save agent message to conversation
    const message = await ChatMessage.create({
      conversationId: ticket.conversationId,
      senderType: "agent",
      senderId: req.user.id,
      content,
    });

    // 2. Automatically update ticket status to IN_PROGRESS if open or assigned
    if (ticket.status === "OPEN" || ticket.status === "ASSIGNED") {
      ticket.status = "IN_PROGRESS";
      await ticket.save();
    }

    return res.status(200).json({
      success: true,
      message: "Reply recorded successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Reply Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while sending ticket reply.",
      data: null,
    });
  }
};

/**
 * @desc    Get dashboard counts and recent tickets dynamically
 * @route   GET /api/tickets/dashboard-stats
 * @access  Private (OWNER, ADMIN, SUPPORT_AGENT)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { Op } = db.Sequelize;

    const baseWhere = { companyId };
    if (req.user.role === "SUPPORT_AGENT") {
      baseWhere.assignedEmployeeId = req.user.id;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Current metrics
    const totalTickets = await Ticket.count({ where: baseWhere });
    const openTickets = await Ticket.count({ where: { ...baseWhere, status: "OPEN" } });
    const inProgressTickets = await Ticket.count({ where: { ...baseWhere, status: "IN_PROGRESS" } });
    const resolvedTickets = await Ticket.count({ where: { ...baseWhere, status: "RESOLVED" } });

    // Historical metrics (from 7 days ago to 14 days ago)
    const prevTotalTickets = await Ticket.count({
      where: { ...baseWhere, createdAt: { [Op.lt]: oneWeekAgo } }
    });
    const prevOpenTickets = await Ticket.count({
      where: { ...baseWhere, status: "OPEN", createdAt: { [Op.lt]: oneWeekAgo } }
    });
    const prevInProgressTickets = await Ticket.count({
      where: { ...baseWhere, status: "IN_PROGRESS", createdAt: { [Op.lt]: oneWeekAgo } }
    });
    const prevResolvedTickets = await Ticket.count({
      where: { ...baseWhere, status: "RESOLVED", createdAt: { [Op.lt]: oneWeekAgo } }
    });

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    // Get 5 recent tickets with customer details
    const recentTickets = await Ticket.findAll({
      where: baseWhere,
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "email", "phone", "location"],
        },
        {
          model: User,
          as: "assignedEmployee",
          attributes: ["id", "name", "email", "role"],
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: 5
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully.",
      data: {
        totalTickets,
        totalGrowth: calcGrowth(totalTickets, prevTotalTickets),
        openTickets,
        openGrowth: calcGrowth(openTickets, prevOpenTickets),
        inProgressTickets,
        inProgressGrowth: calcGrowth(inProgressTickets, prevInProgressTickets),
        resolvedTickets,
        resolvedGrowth: calcGrowth(resolvedTickets, prevResolvedTickets),
        recentTickets
      }
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while calculating metrics.",
      data: null,
    });
  }
};

/**
 * @desc    Create a new support ticket manually
 * @route   POST /api/tickets
 * @access  Private (OWNER, ADMIN, SUPPORT_AGENT)
 */
export const createTicket = async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerLocation,
      subject,
      description,
      priority,
      assignedEmployeeId
    } = req.body;

    if (!customerName || !customerEmail || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Customer name, email, subject and description are required.",
        data: null,
      });
    }

    // 1. Find or create customer
    let customer = await User.findOne({
      where: { email: customerEmail, companyId }
    });

    if (customer) {
      if (customerPhone) customer.phone = customerPhone;
      if (customerLocation) customer.location = customerLocation;
      await customer.save();
    } else {
      const dummyPassword = await bcrypt.hash("customer_temp_pass_123!", 10);
      customer = await User.create({
        name: customerName,
        email: customerEmail,
        phone: customerPhone || null,
        location: customerLocation || null,
        role: "CUSTOMER",
        companyId,
        password: dummyPassword,
        isActive: true,
      });
    }

    // 2. Create a conversation session for the manual ticket
    const conversation = await Conversation.create({
      companyId,
      status: "active",
    });

    // 3. Save initial description as a chat message in the conversation
    await ChatMessage.create({
      conversationId: conversation.id,
      senderType: "visitor",
      content: description,
    });

    // 4. Determine status and create ticket
    const status = assignedEmployeeId ? "ASSIGNED" : "OPEN";
    const ticket = await Ticket.create({
      companyId,
      conversationId: conversation.id,
      customerId: customer.id,
      subject,
      description,
      priority: priority || "MEDIUM",
      status,
      assignedEmployeeId: assignedEmployeeId || null,
    });

    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "email", "phone", "location"],
        },
        {
          model: User,
          as: "assignedEmployee",
          attributes: ["id", "name", "email", "role"],
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully.",
      data: fullTicket,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating ticket.",
      data: null,
    });
  }
};
