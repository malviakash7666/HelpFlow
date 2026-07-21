import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT Access Token valid for 15 minutes.
 * @param {Object} company - The company database object or payload.
 * @returns {string} Signed JWT Access Token.
 */
export const generateAccessToken = (company) => {
  return jwt.sign(
    {
      id: company.id,
      email: company.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    }
  );
};

/**
 * Generates a signed JWT Refresh Token valid for 7 days.
 * @param {Object} company - The company database object or payload.
 * @returns {string} Signed JWT Refresh Token.
 */
export const generateRefreshToken = (company) => {
  return jwt.sign(
    {
      id: company.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );
};
