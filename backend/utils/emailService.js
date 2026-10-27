const nodemailer = require('nodemailer');
const crypto = require('crypto');
const env = require('../config/env');

let cachedTransporter = null;

/**
 * Checks if real SMTP configuration is provided in the environment.
 */
function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

/**
 * Returns a configured nodemailer transporter with Brevo defaults and timeouts.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (isSmtpConfigured()) {
    cachedTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
      connectionTimeout: 10000, // 10s
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: env.nodeEnv === 'production',
        minVersion: 'TLSv1.2',
      },
    });
    return cachedTransporter;
  }

  return null;
}

/**
 * Generates a cryptographically secure 6-digit OTP string (100000 - 999999).
 */
function generateSixDigitOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP with SHA-256 for secure database storage.
 */
function hashOtp(rawOtp) {
  return crypto.createHash('sha256').update(String(rawOtp).trim()).digest('hex');
}

/**
 * Performs constant-time comparison of a submitted OTP against the stored SHA-256 hash.
 */
function verifyOtpHash(rawOtp, storedHash) {
  if (!rawOtp || !storedHash) return false;
  const computedHash = hashOtp(rawOtp);
  try {
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Hashes a raw verification token with SHA-256 for secure storage.
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

/**
 * Generates a cryptographically strong 32-byte hex token.
 */
function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sends an email using Brevo SMTP or falls back to development preview if SMTP is unconfigured.
 */
async function sendMail({ to, subject, html, text }) {
  const from = env.emailFrom;
  const transporter = getTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({ from, to, subject, html, text });
      return {
        success: true,
        delivered: true,
        mode: 'smtp',
        messageId: info.messageId,
      };
    } catch (err) {
      console.error('[emailService] SMTP delivery error:', err.message);
      return {
        success: false,
        delivered: false,
        mode: 'smtp_error',
        error: `Email delivery failed: ${err.message}`,
      };
    }
  }

  // Development Fallback: If SMTP is explicitly not configured, log preview without crashing
  console.info('\n==================== [DEV EMAIL PREVIEW] ====================');
  console.info('[Notice] SMTP credentials not set. Simulated email:');
  console.info(`To:      ${to}`);
  console.info(`From:    ${from}`);
  console.info(`Subject: ${subject}`);
  if (text) console.info(`Text:\n${text}`);
  console.info('=============================================================\n');

  return {
    success: true,
    delivered: false,
    mode: 'development_preview',
    note: 'SMTP not configured in environment; simulated in development console.',
  };
}

/**
 * Sends a 6-digit email verification OTP with AlumniConnect KKWAGH branding.
 */
async function sendVerificationOtpEmail(toEmail, otp, name = 'Student / Alumnus') {
  const expiryMinutes = env.otpExpiryMinutes || 5;
  const subject = `${otp} is your AlumniConnect verification code`;

  const text = `Hello ${name},\n\n` +
    `Your AlumniConnect email verification code is: ${otp}\n\n` +
    `This verification code expires in ${expiryMinutes} minutes.\n` +
    `Enter this code on the verification screen to activate your account.\n\n` +
    `If you did not request this verification code, please ignore this email.\n\n` +
    `K.K. Wagh Institute of Engineering Education & Research (KKWAGH), Nashik`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your AlumniConnect Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
          .logo { font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
          .college { font-size: 13px; color: #64748b; margin-top: 4px; }
          .content { font-size: 15px; line-height: 1.6; color: #334155; }
          .otp-container { text-align: center; margin: 28px 0; }
          .otp-box { display: inline-block; background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #15803d; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; }
          .badge { display: inline-block; background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
          .warning { font-size: 13px; color: #64748b; background-color: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 20px; text-align: center; border: 1px solid #e2e8f0; }
          .footer { margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AlumniConnect</div>
            <div class="college">K.K. Wagh Institute of Engineering Education & Research, Nashik</div>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">Official Institutional Verification</span>
            </div>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for registering on AlumniConnect with your official college email (<code>${toEmail}</code>).</p>
            <p>Use the following 6-digit verification code to complete your registration:</p>
            <div class="otp-container">
              <div class="otp-box">${otp}</div>
            </div>
            <div class="warning">
              ⏱️ This code is valid for <strong>${expiryMinutes} minutes</strong>. Never share this code with anyone.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AlumniConnect · K.K. Wagh Institute of Engineering Education & Research.<br/>
            This is an automated message sent via Brevo SMTP.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({ to: toEmail, subject, html, text });
}

/**
 * Sends a 6-digit password reset OTP with AlumniConnect KKWAGH branding.
 */
async function sendPasswordResetOtpEmail(toEmail, otp, name = 'User') {
  const expiryMinutes = env.otpExpiryMinutes || 5;
  const subject = `${otp} is your AlumniConnect password reset code`;

  const text = `Hello ${name},\n\n` +
    `We received a request to reset the password for your AlumniConnect account (${toEmail}).\n\n` +
    `Your 6-digit password reset code is: ${otp}\n\n` +
    `This code will expire in ${expiryMinutes} minutes.\n` +
    `Enter this code to set a new password.\n\n` +
    `If you did not request a password reset, please ignore this email; your current password remains secure.\n\n` +
    `K.K. Wagh Institute of Engineering Education & Research (KKWAGH), Nashik`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset your AlumniConnect Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
          .logo { font-size: 22px; font-weight: 800; color: #0d9488; letter-spacing: -0.5px; }
          .college { font-size: 13px; color: #64748b; margin-top: 4px; }
          .content { font-size: 15px; line-height: 1.6; color: #334155; }
          .otp-container { text-align: center; margin: 28px 0; }
          .otp-box { display: inline-block; background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 10px; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #0f766e; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; }
          .badge { display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
          .warning { font-size: 13px; color: #64748b; background-color: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 20px; text-align: center; border: 1px solid #e2e8f0; }
          .footer { margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AlumniConnect</div>
            <div class="college">K.K. Wagh Institute of Engineering Education & Research, Nashik</div>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">Password Reset Request</span>
            </div>
            <p>Hello <strong>${name}</strong>,</p>
            <p>We received a request to reset your password for the account associated with <code>${toEmail}</code>.</p>
            <p>Enter the 6-digit recovery code below to choose a new password:</p>
            <div class="otp-container">
              <div class="otp-box">${otp}</div>
            </div>
            <div class="warning">
              ⏱️ This code will expire in <strong>${expiryMinutes} minutes</strong>.<br/>
              If you did not request this password recovery, you can safely ignore this email.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AlumniConnect · K.K. Wagh Institute of Engineering Education & Research.<br/>
            This is an automated message sent via Brevo SMTP.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({ to: toEmail, subject, html, text });
}

/**
 * Legacy URL verification email helper (preserved for backward compatibility).
 */
async function sendVerificationEmail(user, rawToken) {
  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
  const subject = 'Verify your AlumniConnect KKWAGH account';

  const text = `Hello ${user.name},\n\n` +
    `Welcome to AlumniConnect - K.K. Wagh Institute of Engineering Education & Research (KKWAGH).\n\n` +
    `Please verify your institutional email address by visiting this link:\n` +
    `${verifyUrl}\n\n` +
    `This verification link will expire in 24 hours.\n` +
    `If you did not create this account, please ignore this email.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #1e3a8a; }
          .college { font-size: 13px; color: #64748b; margin-top: 4px; }
          .content { font-size: 15px; line-height: 1.6; color: #334155; }
          .btn { display: inline-block; background-color: #1e3a8a; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin: 20px 0; }
          .footer { margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
          .link-box { word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 12px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AlumniConnect</div>
            <div class="college">K.K. Wagh Institute of Engineering Education & Research, Nashik</div>
          </div>
          <div class="content">
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Thank you for registering on AlumniConnect with your official college email (<code>${user.email}</code>).</p>
            <p>Please click the button below to verify your email and activate your account:</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Address</a>
            </p>
            <p>Or paste this link into your browser:</p>
            <p class="link-box">${verifyUrl}</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AlumniConnect · K.K. Wagh Institute of Engineering Education & Research
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({ to: user.email, subject, html, text });
}

/**
 * Legacy URL password reset email helper (preserved for backward compatibility).
 */
async function sendPasswordResetEmail(user, rawToken) {
  const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
  const subject = 'Reset your AlumniConnect KKWAGH password';

  const text = `Hello ${user.name},\n\n` +
    `We received a request to reset the password for your AlumniConnect account (${user.email}).\n\n` +
    `Click the link below to set a new password:\n` +
    `${resetUrl}\n\n` +
    `This password reset link will expire in 1 hour.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #0d9488; }
          .college { font-size: 13px; color: #64748b; margin-top: 4px; }
          .content { font-size: 15px; line-height: 1.6; color: #334155; }
          .btn { display: inline-block; background-color: #0d9488; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin: 20px 0; }
          .footer { margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
          .link-box { word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 12px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AlumniConnect</div>
            <div class="college">K.K. Wagh Institute of Engineering Education & Research, Nashik</div>
          </div>
          <div class="content">
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Please click the button below to choose a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
            </p>
            <p class="link-box">${resetUrl}</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AlumniConnect · K.K. Wagh Institute of Engineering Education & Research
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({ to: user.email, subject, html, text });
}

/**
 * Reusable helper to send branded email notifications for platform events.
 */
async function sendNotificationEmail(toEmail, { title, body, actionUrl, actionText }) {
  const fullActionUrl = actionUrl
    ? (actionUrl.startsWith('http') ? actionUrl : `${env.clientUrl}${actionUrl}`)
    : null;

  const text = `${title}\n\n${body}\n\n` +
    (fullActionUrl ? `View in AlumniConnect: ${fullActionUrl}\n\n` : '') +
    `AlumniConnect KKWAGH`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; }
          .logo { font-size: 20px; font-weight: 800; color: #1e3a8a; }
          .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 16px; margin-bottom: 8px; }
          .body { font-size: 14px; line-height: 1.6; color: #334155; }
          .btn { display: inline-block; background-color: #1e3a8a; color: #ffffff !important; padding: 10px 22px; border-radius: 6px; font-weight: 600; text-decoration: none; margin-top: 16px; }
          .footer { margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 14px; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">AlumniConnect KKWAGH</div>
          <div class="title">${title}</div>
          <div class="body">
            <p>${body}</p>
            ${fullActionUrl ? `<a href="${fullActionUrl}" class="btn" target="_blank">${actionText || 'View Details'}</a>` : ''}
          </div>
          <div class="footer">
            You received this notification from AlumniConnect (K.K. Wagh Institute of Engineering Education & Research).
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({ to: toEmail, subject: title, html, text });
}

/**
 * Tests the SMTP connection safely without exposing sensitive configuration.
 */
async function testSmtpConnection() {
  if (!isSmtpConfigured()) {
    return {
      configured: false,
      message: 'SMTP is not configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS). Using development preview mode.',
    };
  }

  const transporter = getTransporter();
  try {
    await transporter.verify();
    return {
      configured: true,
      verified: true,
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      from: env.emailFrom,
    };
  } catch (err) {
    return {
      configured: true,
      verified: false,
      error: `SMTP connection failed: ${err.message}`,
    };
  }
}

module.exports = {
  isSmtpConfigured,
  getTransporter,
  generateSixDigitOtp,
  hashOtp,
  verifyOtpHash,
  hashToken,
  generateRawToken,
  sendMail,
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  testSmtpConnection,
};
