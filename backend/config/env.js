const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/db_alumini_years',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.APP_BASE_URL || process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  collegeName: process.env.COLLEGE_NAME || 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
  allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN || 'kkwagh.edu.in',
  smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpSecure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: (process.env.SMTP_PASS || '').replace(/^your_generated_smtp_key/, '').trim(),
  smtpFrom: process.env.SMTP_FROM || 'jkmahant370124@kkwagh.edu.in',
  smtpFromName: process.env.SMTP_FROM_NAME || 'AlumniConnect',
  emailFrom: (process.env.SMTP_FROM_NAME && process.env.SMTP_FROM)
    ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`
    : (process.env.EMAIL_FROM || '"AlumniConnect" <jkmahant370124@kkwagh.edu.in>'),
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
  otpResendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60,
};

if (!env.jwtSecret) {
  if (env.nodeEnv === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production and must not be empty.');
  }
  // Deterministic development fallback secret so nodemon/watcher restarts preserve user login sessions
  env.jwtSecret = 'alumniconnect-kkwagh-dev-stable-secret-2026';
  console.info('[config] Using stable development JWT_SECRET.');
} else if (env.nodeEnv === 'production' && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET in production must be at least 32 characters long for cryptographic security.');
}

module.exports = env;
