import db from "../../database/models/index.js";

const { Company, User, Document, Ticket, AuditLog, UsageAnalytics } = db;

/**
 * Company-isolated Admin Overview Metrics
 */
export const getSystemOverview = async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        data: null,
      });
    }

    const totalUsers = (await User?.count({ where: { companyId } })) || 0;
    const totalDocuments = (await Document?.count({ where: { companyId } })) || 0;
    const totalTickets = (await Ticket?.count({ where: { companyId } })) || 0;

    const usage =
      (await UsageAnalytics?.findAll({
        where: { companyId },
        order: [["date", "DESC"]],
        limit: 30,
      })) || [];

    const recentLogs =
      (await AuditLog?.findAll({
        where: { companyId },
        order: [["createdAt", "DESC"]],
        limit: 20,
      })) || [];

    return res.status(200).json({
      success: true,
      message: "Company admin metrics retrieved.",
      data: {
        totalCompanies: 1,
        totalUsers,
        totalDocuments,
        totalTickets,
        usage,
        recentLogs,
      },
    });
  } catch (err) {
    console.error("Admin Overview Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching admin stats.",
      data: null,
    });
  }
};

/**
 * Company-isolated Company Profile Details
 */
export const listCompaniesAdmin = async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        data: null,
      });
    }

    const companies =
      (await Company?.findAll({
        where: { id: companyId },
        attributes: { exclude: ["password"] },
        order: [["createdAt", "DESC"]],
      })) || [];

    return res.status(200).json({
      success: true,
      message: "Company details retrieved.",
      data: companies,
    });
  } catch (err) {
    console.error("Admin List Companies Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error listing companies.",
      data: null,
    });
  }
};

/**
 * Company-isolated Security Audit Logs
 */
export const getAuditLogsAdmin = async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        data: null,
      });
    }

    const logs =
      (await AuditLog?.findAll({
        where: { companyId },
        order: [["createdAt", "DESC"]],
        limit: 100,
      })) || [];

    return res.status(200).json({
      success: true,
      message: "Company audit logs retrieved.",
      data: logs,
    });
  } catch (err) {
    console.error("Admin Audit Logs Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching logs.",
      data: null,
    });
  }
};
