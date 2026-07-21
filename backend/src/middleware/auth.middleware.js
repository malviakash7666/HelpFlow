import jwt from "jsonwebtoken";
import db from "../database/models/index.js";

const { Company, User } = db;

/**
 * Middleware to authenticate company-level requests.
 * Supports Bearer header tokens and HTTP-Only accessToken cookies.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Access token is missing.",
        data: null,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token has expired. Please refresh your token.",
          data: null,
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
        data: null,
      });
    }

    // 1. Check if decoded.id belongs to a User (e.g. Employee, Support Agent, Owner)
    let user = await User.findByPk(decoded.id);
    let company = null;

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "This user account has been deactivated.",
          data: null,
        });
      }
      company = await Company.findByPk(user.companyId);
      req.user = user;
    } else {
      // 2. Otherwise check if decoded.id belongs to a Company directly
      company = await Company.findByPk(decoded.id);
    }

    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Company account not found.",
        data: null,
      });
    }

    if (!company.isActive) {
      return res.status(403).json({
        success: false,
        message: "This company account has been deactivated.",
        data: null,
      });
    }

    // Attach company instance to request object
    req.company = company;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
      data: null,
    });
  }
};

/**
 * Middleware to authenticate user-level requests (Employees, Owners, Admins).
 * Supports Bearer header tokens and HTTP-Only accessToken cookies.
 */
export const userAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Access token is missing.",
        data: null,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token has expired. Please refresh your token.",
          data: null,
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
        data: null,
      });
    }

    // 1. Check if the token belongs to a User directly
    let user = await User.findByPk(decoded.id);
    let company = null;

    if (user) {
      company = await Company.findByPk(user.companyId);
    } else {
      company = await Company.findByPk(decoded.id);
      if (company) {
        user = await User.findOne({
          where: {
            companyId: company.id,
            role: "OWNER",
          },
        });
      }
    }

    if (!user || !company) {
      return res.status(401).json({
        success: false,
        message: "User or associated company account not found.",
        data: null,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This user account has been deactivated.",
        data: null,
      });
    }

    if (!company.isActive) {
      return res.status(403).json({
        success: false,
        message: "This company account has been deactivated.",
        data: null,
      });
    }

    // Attach user and company instances to request object
    req.user = user;
    req.company = company;
    next();
  } catch (error) {
    console.error("User Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during user authentication.",
      data: null,
    });
  }
};

/**
 * Role-based authorization middleware.
 * @param {...string} allowedRoles - List of allowed roles for the route.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        data: null,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
        data: null,
      });
    }

    next();
  };
};
