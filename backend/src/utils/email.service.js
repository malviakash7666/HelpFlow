import nodemailer from "nodemailer";

/**
 * Creates a Nodemailer transporter using environment variables or fallback configuration.
 */
const createTransporter = () => {
  let host = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";
  let service = process.env.SMTP_SERVICE ? process.env.SMTP_SERVICE.trim() : "";

  // Normalize if user entered 'gmail' or 'gmail.com' as SMTP_HOST
  if (host.toLowerCase() === "gmail" || host.toLowerCase() === "gmail.com") {
    service = "gmail";
    host = "smtp.gmail.com";
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  // Return null if SMTP credentials are not configured in .env
  return null;
};

/**
 * Sends a password reset email using Nodemailer.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} resetToken - 6-digit verification reset token
 */
export const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"AI Support Desk" <noreply@aisupportdesk.com>';

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: "Password Reset Verification Code - AI Support Desk",
    text: `Hello,\n\nYou requested a password reset for your AI Support Desk account.\n\nYour 6-digit verification reset code is: ${resetToken}\n\nThis code will expire in 15 minutes. If you did not request a password reset, please ignore this email.\n\nBest regards,\nAI Support Desk Team`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #070b19; color: #f1f5f9; padding: 32px; borderRadius: 16px; max-width: 550px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #60a5fa; margin: 0; font-size: 24px; font-weight: 800;">AI Support Desk</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Account Password Reset</p>
        </div>
        <div style="background-color: #0c1226; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">You requested a password reset. Use the verification code below:</p>
          <div style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #818cf8; background-color: #060e1d; border: 1px solid #312e81; padding: 12px 24px; border-radius: 8px; display: inline-block; margin: 16px 0;">
            ${resetToken}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">This code is valid for 15 minutes.</p>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  if (!transporter) {
    console.log(`\n==================================================`);
    console.log(`[NODEMAILER MOCK TRANSPORTER - SMTP credentials not set]`);
    console.log(`To: ${toEmail}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`To enable real email sending, add SMTP_HOST, SMTP_USER, and SMTP_PASS to backend/.env`);
    console.log(`==================================================\n`);
    return { success: true, sent: false, mock: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[NODEMAILER SUCCESS] Password reset email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[NODEMAILER ERROR] Failed to send email to ${toEmail}:`, error);
    // Return gracefully so user process is not blocked
    return { success: false, error: error.message };
  }
};
