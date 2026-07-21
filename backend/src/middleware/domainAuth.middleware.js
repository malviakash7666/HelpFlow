import db from "../database/models/index.js";

const { Bot } = db;

/**
 * Clean domain string by stripping protocol, port, and paths
 */
const cleanDomain = (urlOrDomain) => {
  if (!urlOrDomain) return "";
  try {
    const parsed = new URL(urlOrDomain.startsWith("http") ? urlOrDomain : `https://${urlOrDomain}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return urlOrDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split(":")[0].split("/")[0].toLowerCase();
  }
};

/**
 * Middleware to validate request Origin/Referer against allowed domains
 */
export const domainAuthMiddleware = async (req, res, next) => {
  try {
    // In development mode, allow localhost requests
    if (process.env.NODE_ENV !== "production") {
      const origin = req.headers.origin || req.headers.referer;
      if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return next();
      }
    }

    const originHeader = req.headers.origin || req.headers.referer;
    if (!originHeader) {
      return res.status(403).json({
        success: false,
        message: "403 Forbidden: Missing Origin or Referer header.",
        data: null,
      });
    }

    const requestDomain = cleanDomain(originHeader);

    // Identify Bot ID or Public Key from query, body, or headers
    const botId = req.query.botId || req.body?.botId || req.headers["x-bot-id"];

    let allowedDomains = [];

    if (botId && Bot) {
      const bot = await Bot.findByPk(botId);
      if (bot && bot.allowedDomains) {
        allowedDomains = Array.isArray(bot.allowedDomains)
          ? bot.allowedDomains
          : JSON.parse(bot.allowedDomains || "[]");
      }
    } else if (req.company) {
      allowedDomains = req.company.allowedDomains || [];
    }

    // If no specific domain restriction is set, allow by default
    if (!allowedDomains || allowedDomains.length === 0) {
      return next();
    }

    // Check if domain is whitelisted
    const isWhitelisted = allowedDomains.some((domain) => {
      const cleaned = cleanDomain(domain);
      if (cleaned === "*" || cleaned === requestDomain) return true;
      // Support subdomain wildcard (e.g. *.domain.com)
      if (cleaned.startsWith("*.") && requestDomain.endsWith(cleaned.slice(2))) return true;
      return false;
    });

    if (!isWhitelisted) {
      return res.status(403).json({
        success: false,
        message: "403 Forbidden: Unauthorized Domain.",
        data: null,
      });
    }

    next();
  } catch (error) {
    console.error("Domain Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during domain verification.",
      data: null,
    });
  }
};
