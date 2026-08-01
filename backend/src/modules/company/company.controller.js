import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../database/models/index.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { sendPasswordResetEmail } from "../../utils/email.service.js";

const { Company, User } = db;

/**
 * Utility to strip passwords from company JSON objects.
 */
const formatCompanyResponse = (company) => {
  const data = company.toJSON ? company.toJSON() : company;
  delete data.password;
  return data;
};

/**
 * Common cookie options for Refresh Token
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // In development, 'lax' is preferred for localhost cross-port cookie transmission. SameSite=None is required for cross-domain cookies in production.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * @desc    Register a new company and automatically log in
 * @route   POST /api/company/register
 * @access  Public
 */
export const registerCompany = async (req, res) => {
  try {
    const { name, email, password, website, description, logo, industry } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
        data: null,
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
        data: null,
      });
    }

    // 2. Check duplicate email
    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "A company with this email address already exists.",
        data: null,
      });
    }

    // 3. Hash password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Create company
    const newCompany = await Company.create({
      name,
      email,
      password: hashedPassword,
      website: website || null,
      description: description || null,
      logo: logo || null,
      industry: industry || null,
    });

    // 5. Create the corresponding OWNER user record in users table
    await User.create({
      name: name + " Owner",
      email,
      password: hashedPassword,
      role: "OWNER",
      companyId: newCompany.id,
      isActive: true,
    });

    // 6. Auto Login: Generate Tokens and set Refresh Token cookie
    const accessToken = generateAccessToken(newCompany);
    const refreshToken = generateRefreshToken(newCompany);

    res.cookie("accessToken", accessToken, getCookieOptions());
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    // 7. Return success response (never return password)
    return res.status(201).json({
      success: true,
      message: "Company registered and logged in successfully.",
      data: {
        company: formatCompanyResponse(newCompany),
        accessToken,
      },
    });
  } catch (error) {
    console.error("Register Company Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
      data: null,
    });
  }
};

/**
 * @desc    Login company & issue tokens
 * @route   POST /api/company/login
 * @access  Public
 */
export const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate credentials payload
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
        data: null,
      });
    }

    // 2. Check Users table first (supports Employees, Support Agents, Admins & Owners)
    let user = await User.findOne({ where: { email } });
    let company = null;

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your employee account is deactivated.",
          data: null,
        });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
          data: null,
        });
      }

      company = await Company.findByPk(user.companyId);
      if (!company || !company.isActive) {
        return res.status(403).json({
          success: false,
          message: "The associated company account is inactive.",
          data: null,
        });
      }

      const accessToken = generateAccessToken({ id: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ id: user.id });

      res.cookie("accessToken", accessToken, getCookieOptions());
      res.cookie("refreshToken", refreshToken, getCookieOptions());

      const companyData = formatCompanyResponse(company);
      companyData.userRole = user.role;
      companyData.userName = user.name;
      companyData.userId = user.id;

      return res.status(200).json({
        success: true,
        message: "Login successful.",
        data: {
          company: companyData,
          accessToken,
        },
      });
    }

    // 3. Fallback search in Companies table (for direct company owner account)
    company = await Company.findOne({ where: { email } });
    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

    if (!company.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your company account is suspended.",
        data: null,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, company.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

    // Ensure corresponding OWNER user exists in users table for back-compatibility
    let ownerUser = await User.findOne({
      where: { companyId: company.id, role: "OWNER" },
    });
    if (!ownerUser) {
      ownerUser = await User.create({
        name: company.name + " Owner",
        email: company.email,
        password: company.password,
        role: "OWNER",
        companyId: company.id,
        isActive: true,
      });
    }

    const accessToken = generateAccessToken({ id: ownerUser.id, email: ownerUser.email });
    const refreshToken = generateRefreshToken({ id: ownerUser.id });

    res.cookie("accessToken", accessToken, getCookieOptions());
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    const companyData = formatCompanyResponse(company);
    companyData.userRole = ownerUser.role;
    companyData.userName = ownerUser.name;
    companyData.userId = ownerUser.id;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        company: companyData,
        accessToken,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login.",
      data: null,
    });
  }
};

/**
 * @desc    Logout company & clear cookie
 * @route   POST /api/company/logout
 * @access  Private
 */
export const logoutCompany = async (req, res) => {
  try {
    // Clear Refresh Token cookie with matching domain/security options
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Logout Company Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout.",
      data: null,
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/company/refresh-token
 * @access  Public
 */
export const refreshAccessToken = async (req, res) => {
  try {
    // 1. Read refresh token from cookies
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing from request cookies.",
        data: null,
      });
    }

    // 2. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
        data: null,
      });
    }

    // 3. First check if decoded.id belongs to a User (e.g. Employee)
    let user = await User.findByPk(decoded.id);
    let company = null;

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Employee account is currently inactive.",
          data: null,
        });
      }
      company = await Company.findByPk(user.companyId);
    } else {
      company = await Company.findByPk(decoded.id);
    }

    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Associated company account not found.",
        data: null,
      });
    }

    if (!company.isActive) {
      return res.status(403).json({
        success: false,
        message: "Company account is currently inactive.",
        data: null,
      });
    }

    // 4. Generate new access token
    const tokenPayload = user
      ? { id: user.id, email: user.email }
      : { id: company.id, email: company.email };

    const newAccessToken = generateAccessToken(tokenPayload);
    res.cookie("accessToken", newAccessToken, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while refreshing token.",
      data: null,
    });
  }
};

/**
 * @desc    Get current company profile
 * @route   GET /api/company/profile
 * @access  Private
 */
export const getCompanyProfile = async (req, res) => {
  try {
    const companyData = formatCompanyResponse(req.company);
    let userRole = "OWNER";
    let userName = req.company.name + " Owner";
    let userId = null;

    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user) {
          userRole = user.role;
          userName = user.name;
          userId = user.id;
        }
      } catch (e) {}
    }

    if (!userId) {
      const ownerUser = await User.findOne({
        where: { companyId: req.company.id, role: "OWNER" }
      });
      if (ownerUser) {
        userId = ownerUser.id;
        userName = ownerUser.name;
      }
    }

    companyData.userRole = userRole;
    companyData.userName = userName;
    companyData.userId = userId;

    return res.status(200).json({
      success: true,
      message: "Company profile retrieved successfully.",
      data: companyData,
    });
  } catch (error) {
    console.error("Get Company Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile.",
      data: null,
    });
  }
};

/**
 * @desc    Update company profile
 * @route   PUT /api/company/profile
 * @access  Private
 */
export const updateCompanyProfile = async (req, res) => {
  try {
    const {
      name,
      website,
      description,
      logo,
      industry,
      autoAssignmentEnabled,
      assignmentMethod,
      assignTo,
      fallbackEmployeeId
    } = req.body;

    if (name !== undefined) req.company.name = name;
    if (website !== undefined) req.company.website = website;
    if (description !== undefined) req.company.description = description;
    if (logo !== undefined) req.company.logo = logo;
    if (industry !== undefined) req.company.industry = industry;
    
    if (autoAssignmentEnabled !== undefined) req.company.autoAssignmentEnabled = autoAssignmentEnabled;
    if (assignmentMethod !== undefined) req.company.assignmentMethod = assignmentMethod;
    if (assignTo !== undefined) req.company.assignTo = assignTo;
    
    if (fallbackEmployeeId !== undefined) {
      req.company.fallbackEmployeeId = fallbackEmployeeId || null;
    }

    await req.company.save();

    return res.status(200).json({
      success: true,
      message: "Company profile updated successfully.",
      data: formatCompanyResponse(req.company),
    });
  } catch (error) {
    console.error("Update Company Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating profile.",
      data: null,
    });
  }
};

// In-memory token storage for password reset tokens
const resetTokenStore = new Map();

/**
 * @desc    Request password reset token
 * @route   POST /api/company/forgot-password
 * @access  Public
 */
export const forgotPasswordCompany = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
        data: null,
      });
    }

    const emailLower = email.trim().toLowerCase();

    // Check if account exists in User or Company table
    const user = await User.findOne({ where: { email: emailLower } });
    const company = await Company.findOne({ where: { email: emailLower } });

    if (!user && !company) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for this email, reset instructions have been generated.",
        data: { resetToken: null },
      });
    }

    // Generate a 6-digit numeric reset token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    resetTokenStore.set(emailLower, { token, expiresAt });

    // Send email using Nodemailer service
    await sendPasswordResetEmail(emailLower, token);

    return res.status(200).json({
      success: true,
      message: "Password reset code sent to your email. Enter the 6-digit verification code below to set a new password.",
      data: null,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during password reset request.",
      data: null,
    });
  }
};

/**
 * @desc    Reset password using reset token
 * @route   POST /api/company/reset-password
 * @access  Public
 */
export const resetPasswordCompany = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, reset token, and new password are required.",
        data: null,
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
        data: null,
      });
    }

    const emailLower = email.trim().toLowerCase();
    const storedRecord = resetTokenStore.get(emailLower);

    if (!storedRecord || storedRecord.token !== token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please request a new token.",
        data: null,
      });
    }

    if (Date.now() > storedRecord.expiresAt) {
      resetTokenStore.delete(emailLower);
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new token.",
        data: null,
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update in User and/or Company tables
    let updated = false;

    const user = await User.findOne({ where: { email: emailLower } });
    if (user) {
      user.password = hashedPassword;
      await user.save();
      updated = true;
    }

    const company = await Company.findOne({ where: { email: emailLower } });
    if (company) {
      company.password = hashedPassword;
      await company.save();
      updated = true;
    }

    // Clear reset token
    resetTokenStore.delete(emailLower);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Account not found for this email address.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
      data: null,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while resetting password.",
      data: null,
    });
  }
};
