import db from "../database/models/index.js";

const { AuditLog } = db;

/**
 * Audit log recording helper
 */
export const recordAuditLog = async ({ companyId, action, actorId, ipAddress, details }) => {
  try {
    if (AuditLog) {
      await AuditLog.create({
        companyId: companyId || null,
        action,
        actorId: actorId || null,
        ipAddress: ipAddress || "unknown",
        details: typeof details === "object" ? JSON.stringify(details) : details,
      });
    }
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
};

/**
 * Middleware to auto-log sensitive route access
 */
export const auditLogMiddleware = (actionName) => {
  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const companyId = req.company?.id || req.user?.companyId || null;
    const actorId = req.user?.id || req.company?.id || null;

    res.on("finish", () => {
      if (res.statusCode < 400) {
        recordAuditLog({
          companyId,
          action: actionName || `${req.method} ${req.originalUrl}`,
          actorId,
          ipAddress: Array.isArray(ip) ? ip[0] : ip,
          details: {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
          },
        });
      }
    });

    next();
  };
};
