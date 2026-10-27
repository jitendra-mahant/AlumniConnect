const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const EmailOtp = require('../models/EmailOtp');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const env = require('../config/env');
const { notifyRole } = require('../utils/notify');
const emailService = require('../utils/emailService');
const {
  generateSixDigitOtp,
  hashOtp,
  verifyOtpHash,
  hashToken,
  testSmtpConnection,
} = emailService;

async function loadProfile(user) {
  if (user.role === 'alumni') return AlumniProfile.findOne({ user: user._id });
  if (user.role === 'student') return StudentProfile.findOne({ user: user._id });
  if (user.role === 'teacher') return TeacherProfile.findOne({ user: user._id });
  return null;
}

/**
 * Validates institutional domain (@kkwagh.edu.in).
 */
function validateCollegeEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const domain = env.allowedEmailDomain || 'kkwagh.edu.in';
  const regex = new RegExp(`^[a-zA-Z0-9._%+-]+@${domain.replace('.', '\\.')}$`, 'i');
  return { valid: regex.test(normalized), normalized, domain };
}

// POST /api/auth/register
// Initiates user registration by validating details, creating an unverified account, and dispatching a 6-digit OTP via Brevo SMTP
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');

  const { valid, normalized, domain } = validateCollegeEmail(email);
  if (!valid) {
    throw new ApiError(
      400,
      `Registration is restricted to official college email addresses (@${domain}). Personal and external email addresses are not permitted.`
    );
  }

  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  // Admin accounts can never be self-registered.
  if (role && !['student', 'alumni', 'teacher'].includes(role)) {
    throw new ApiError(400, 'Role must be student, alumni, or teacher');
  }

  const existing = await User.findOne({ email: normalized });
  if (existing && existing.isVerified) {
    throw new ApiError(
      409,
      'An account with this institutional email already exists. Please log in or reset your password.',
      {
        code: 'DUPLICATE_EMAIL',
        email: normalized,
      }
    );
  }

  // Check 60-second resend cooldown for active registration OTP
  const cooldownSeconds = env.otpResendCooldownSeconds || 60;
  const recentOtp = await EmailOtp.findOne({
    email: normalized,
    purpose: 'registration',
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (recentOtp && recentOtp.lastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(recentOtp.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      const waitRemaining = Math.ceil(cooldownSeconds - elapsedSeconds);
      throw new ApiError(
        429,
        `Please wait ${waitRemaining} seconds before requesting another verification code.`,
        { code: 'COOLDOWN_ACTIVE', cooldown: waitRemaining }
      );
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = generateSixDigitOtp();
  const expiryMinutes = env.otpExpiryMinutes || 5;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Deliver verification OTP via Brevo SMTP
  const mailResult = await emailService.sendVerificationOtpEmail(normalized, otp, name.trim());
  if (!mailResult.success && mailResult.mode === 'smtp_error') {
    throw new ApiError(500, `Failed to dispatch verification email via Brevo SMTP: ${mailResult.error || 'Connection error'}`);
  }

  // Invalidate any previous unconsumed registration OTPs for this email
  await EmailOtp.updateMany(
    { email: normalized, purpose: 'registration', consumedAt: null },
    { $set: { consumedAt: new Date(), metadata: { reason: 'superseded_by_new_otp' } } }
  );

  // Store hashed OTP in MongoDB
  await EmailOtp.create({
    email: normalized,
    otpHash: hashOtp(otp),
    purpose: 'registration',
    attempts: 0,
    maxAttempts: env.otpMaxAttempts || 5,
    expiresAt,
    lastSentAt: new Date(),
    metadata: {
      name: name.trim(),
      role: role || 'student',
    },
  });

  // Create or update pending unverified user record
  let user = existing;
  if (!user) {
    user = await User.create({
      name: name.trim(),
      email: normalized,
      password,
      role: role || 'student',
      isVerified: false,
      verificationStatus: 'pending',
      institution: env.collegeName,
    });

    if (user.role === 'student') {
      await StudentProfile.create({ user: user._id, fullName: user.name, college: env.collegeName });
    } else if (user.role === 'teacher') {
      await TeacherProfile.create({ user: user._id, fullName: user.name, college: env.collegeName });
    } else if (user.role === 'alumni') {
      let existingProfile = await AlumniProfile.findOne({ email: user.email });
      if (existingProfile) {
        existingProfile.user = user._id;
        if (!existingProfile.fullName) existingProfile.fullName = user.name;
        await existingProfile.save();
      } else {
        await AlumniProfile.create({
          user: user._id,
          fullName: user.name,
          email: user.email,
          college: env.collegeName,
          verificationStatus: 'pending',
        });
      }
    }
  } else {
    // Update existing unverified user info
    user.name = name.trim();
    user.password = password;
    user.role = role || 'student';
    user.isVerified = false;
    user.verificationStatus = 'pending';
    await user.save();
  }

  res.status(201).json({
    success: true,
    message: 'A 6-digit verification code has been sent to your institutional email.',
    email: normalized,
    cooldown: cooldownSeconds,
    expiresInMinutes: expiryMinutes,
    requiresVerification: true,
  });
});

// POST /api/auth/verify-otp or /api/auth/verify-email-otp
// Verifies the submitted 6-digit OTP, activates the user account, and issues authentication token
exports.verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, 'Institutional email and 6-digit verification code are required.');
  }

  const { normalized } = validateCollegeEmail(email);
  const cleanOtp = String(otp).trim();

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new ApiError(400, 'Verification code must be exactly 6 digits.');
  }

  // Find the active unconsumed registration OTP
  const otpDoc = await EmailOtp.findOne({
    email: normalized,
    purpose: 'registration',
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    throw new ApiError(400, 'No active verification code found for this email. Please request a new code.', {
      code: 'OTP_NOT_FOUND',
    });
  }

  // Check expiration (5 minutes)
  if (otpDoc.expiresAt < new Date()) {
    throw new ApiError(400, 'This verification code has expired. Please request a new code.', {
      code: 'OTP_EXPIRED',
    });
  }

  // Check maximum attempts (5 attempts limit)
  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    throw new ApiError(400, 'Too many incorrect attempts. This code is now invalid. Please request a new verification code.', {
      code: 'MAX_ATTEMPTS_EXCEEDED',
    });
  }

  // Validate OTP in constant time
  const isMatch = verifyOtpHash(cleanOtp, otpDoc.otpHash);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = Math.max(0, otpDoc.maxAttempts - otpDoc.attempts);

    if (remaining === 0) {
      throw new ApiError(400, 'Too many incorrect attempts. This verification code has been invalidated. Please request a new code.', {
        code: 'MAX_ATTEMPTS_EXCEEDED',
      });
    }

    throw new ApiError(400, `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, {
      code: 'INVALID_OTP',
      attemptsRemaining: remaining,
    });
  }

  // Atomically consume the OTP
  await EmailOtp.findOneAndUpdate(
    { _id: otpDoc._id, consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );

  // Activate the user
  const user = await User.findOne({ email: normalized });
  if (!user) {
    throw new ApiError(404, 'User account not found.');
  }

  user.isVerified = true;
  user.verificationStatus = 'verified';
  user.verifiedAt = new Date();
  await user.save();

  // Link profile if alumni
  if (user.role === 'alumni') {
    let existingProfile = await AlumniProfile.findOne({ email: user.email });
    if (existingProfile) {
      existingProfile.user = user._id;
      if (!existingProfile.fullName) existingProfile.fullName = user.name;
      existingProfile.verificationStatus = 'verified';
      await existingProfile.save();
    } else {
      await AlumniProfile.create({
        user: user._id,
        fullName: user.name,
        email: user.email,
        college: env.collegeName,
        verificationStatus: 'verified',
      });
    }
    await notifyRole('admin', {
      type: 'profile_review',
      title: 'New verified alumni registration',
      body: `${user.name} verified their institutional email (${user.email}).`,
      link: '/admin',
    });
  }

  const token = generateToken(user._id);
  const profile = await loadProfile(user);

  res.json({
    success: true,
    message: 'Institutional email verified successfully! Your account is active.',
    token,
    user,
    profile,
  });
});

// POST /api/auth/resend-otp or /api/auth/resend-verification
// Resends a new 6-digit verification code enforcing a 60-second cooldown
exports.resendVerificationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Institutional email is required');

  const { valid, normalized, domain } = validateCollegeEmail(email);
  if (!valid) throw new ApiError(400, `Please provide a valid institutional email (@${domain}).`);

  const user = await User.findOne({ email: normalized });
  if (user && user.isVerified) {
    return res.json({
      success: true,
      message: 'Your account is already verified. You can log in directly.',
      alreadyVerified: true,
    });
  }

  const cooldownSeconds = env.otpResendCooldownSeconds || 60;
  const recentOtp = await EmailOtp.findOne({
    email: normalized,
    purpose: 'registration',
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (recentOtp && recentOtp.lastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(recentOtp.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      const waitRemaining = Math.ceil(cooldownSeconds - elapsedSeconds);
      throw new ApiError(
        429,
        `Please wait ${waitRemaining} seconds before requesting a new code.`,
        { code: 'COOLDOWN_ACTIVE', cooldown: waitRemaining }
      );
    }
  }

  // Invalidate older unconsumed codes
  await EmailOtp.updateMany(
    { email: normalized, purpose: 'registration', consumedAt: null },
    { $set: { consumedAt: new Date(), metadata: { reason: 'superseded_by_resend' } } }
  );

  const otp = generateSixDigitOtp();
  const expiryMinutes = env.otpExpiryMinutes || 5;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const mailResult = await emailService.sendVerificationOtpEmail(normalized, otp, user ? user.name : 'Student / Alumnus');
  if (!mailResult.success && mailResult.mode === 'smtp_error') {
    throw new ApiError(500, `Failed to dispatch verification email via Brevo SMTP: ${mailResult.error || 'Connection error'}`);
  }

  await EmailOtp.create({
    email: normalized,
    otpHash: hashOtp(otp),
    purpose: 'registration',
    attempts: 0,
    maxAttempts: env.otpMaxAttempts || 5,
    expiresAt,
    lastSentAt: new Date(),
  });

  res.json({
    success: true,
    message: 'A new 6-digit verification code has been sent to your email.',
    cooldown: cooldownSeconds,
    expiresInMinutes: expiryMinutes,
  });
});

exports.verifyEmail = exports.verifyEmailOtp;
exports.resendVerification = exports.resendVerificationOtp;

// POST /api/auth/forgot-password or /api/auth/send-reset-otp
// Issues a 6-digit password recovery code via Brevo SMTP (uniform response to prevent account enumeration)
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email, reason } = req.body;
  if (!email) throw new ApiError(400, 'Institutional email is required');

  const { valid, normalized, domain } = validateCollegeEmail(email);
  if (!valid) {
    throw new ApiError(400, `Please provide a valid official college email address (@${domain}).`);
  }

  const genericSuccess = 'If an account exists for this official college email, a 6-digit password recovery code has been sent.';

  const user = await User.findOne({ email: normalized });
  if (!user || user.status === 'suspended') {
    return res.json({
      success: true,
      message: genericSuccess,
      email: normalized,
      cooldown: 60,
    });
  }

  // Enforce 60-second cooldown for password reset requests
  const cooldownSeconds = env.otpResendCooldownSeconds || 60;
  const recentOtp = await EmailOtp.findOne({
    email: normalized,
    purpose: 'password_reset',
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (recentOtp && recentOtp.lastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(recentOtp.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      return res.json({
        success: true,
        message: genericSuccess,
        email: normalized,
        cooldown: Math.ceil(cooldownSeconds - elapsedSeconds),
      });
    }
  }

  // Invalidate previous active password_reset OTPs
  await EmailOtp.updateMany(
    { email: normalized, purpose: 'password_reset', consumedAt: null },
    { $set: { consumedAt: new Date(), metadata: { reason: 'superseded_by_new_reset' } } }
  );

  const otp = generateSixDigitOtp();
  const expiryMinutes = env.otpExpiryMinutes || 5;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Send password reset OTP email via Brevo SMTP
  await emailService.sendPasswordResetOtpEmail(user.email, otp, user.name);

  // Store hashed OTP for password recovery
  await EmailOtp.create({
    email: normalized,
    otpHash: hashOtp(otp),
    purpose: 'password_reset',
    attempts: 0,
    maxAttempts: env.otpMaxAttempts || 5,
    expiresAt,
    lastSentAt: new Date(),
    metadata: { userId: user._id },
  });

  // Preserve legacy admin recovery request record if reason was provided
  if (reason) {
    await PasswordResetRequest.create({
      user: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      reason: String(reason).trim().slice(0, 300),
      status: 'pending',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      ipAddress: req.ip || '',
    });
  }

  res.json({
    success: true,
    message: genericSuccess,
    email: normalized,
    cooldown: cooldownSeconds,
    expiresInMinutes: expiryMinutes,
  });
});

exports.submitRecoveryRequest = exports.forgotPassword;

// POST /api/auth/reset-password
// Resets password using 6-digit OTP, or administrator temporary credential / token fallback
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password, newPassword, temporaryCredential, token } = req.body;
  const chosenPassword = newPassword || password;

  if (!chosenPassword || chosenPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long.');
  }

  let user = null;

  // Flow 1: 6-digit OTP-based reset (Primary Brevo SMTP flow)
  if (email && otp) {
    const { normalized } = validateCollegeEmail(email);
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      throw new ApiError(400, 'Verification code must be exactly 6 digits.');
    }

    const otpDoc = await EmailOtp.findOne({
      email: normalized,
      purpose: 'password_reset',
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      throw new ApiError(400, 'No active password recovery code found for this email. Please request a new code.', {
        code: 'OTP_NOT_FOUND',
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      throw new ApiError(400, 'This recovery code has expired. Please request a new code.', {
        code: 'OTP_EXPIRED',
      });
    }

    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      throw new ApiError(400, 'Too many incorrect attempts. This recovery code is no longer valid. Please request a new code.', {
        code: 'MAX_ATTEMPTS_EXCEEDED',
      });
    }

    const isMatch = verifyOtpHash(cleanOtp, otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = Math.max(0, otpDoc.maxAttempts - otpDoc.attempts);

      if (remaining === 0) {
        throw new ApiError(400, 'Too many incorrect attempts. This recovery code has been invalidated. Please request a new code.', {
          code: 'MAX_ATTEMPTS_EXCEEDED',
        });
      }

      throw new ApiError(400, `Incorrect recovery code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, {
        code: 'INVALID_OTP',
        attemptsRemaining: remaining,
      });
    }

    // Atomically consume recovery OTP
    await EmailOtp.findOneAndUpdate(
      { _id: otpDoc._id, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );

    user = await User.findOne({ email: normalized }).select('+password +mustChangePassword');
    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }
  } else if (email && temporaryCredential) {
    // Flow 2: Administrator-assisted recovery with temporary credential
    const normalized = String(email).trim().toLowerCase();
    user = await User.findOne({ email: normalized }).select('+password +mustChangePassword');
    if (!user) {
      throw new ApiError(400, 'Invalid recovery details or account not found.');
    }

    const isMatch = await user.matchPassword(String(temporaryCredential).trim());
    if (!isMatch) {
      throw new ApiError(401, 'Invalid or expired temporary credential.');
    }
  } else if (token) {
    // Flow 3: URL token-based recovery
    const tokenHash = hashToken(String(token).trim());
    user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetExpires +password');

    if (!user) {
      throw new ApiError(400, 'This password reset link is invalid or has expired.', {
        code: 'INVALID_OR_EXPIRED_TOKEN',
      });
    }
  } else {
    throw new ApiError(400, 'Institutional email and 6-digit recovery code are required.');
  }

  // Update password and clear any temporary flags
  user.password = chosenPassword;
  user.mustChangePassword = false;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetSentAt = undefined;
  user.isVerified = true;
  await user.save();

  // Complete any pending recovery requests for this user
  await PasswordResetRequest.updateMany(
    { user: user._id, status: { $in: ['pending', 'approved'] } },
    { $set: { status: 'completed', completedAt: new Date() } }
  );

  const profile = await loadProfile(user);
  res.json({
    success: true,
    message: 'Your password has been successfully reset. You can now log in with your new password.',
    token: generateToken(user._id),
    user,
    profile,
  });
});

// PUT /api/auth/change-password
// Allows authenticated users to change their password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters long');
  }

  const user = await User.findById(req.user._id).select('+password +mustChangePassword');
  if (!user) throw new ApiError(404, 'User account not found');

  if (!user.mustChangePassword) {
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required');
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  await PasswordResetRequest.updateMany(
    { user: user._id, status: { $in: ['pending', 'approved'] } },
    { $set: { status: 'completed', completedAt: new Date() } }
  );

  res.json({
    success: true,
    message: 'Your password has been successfully updated.',
  });
});

// POST /api/auth/login
// Blocks login until official institutional email has been verified via OTP
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const normalized = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalized }).select('+password +isVerified');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Please contact the administrator.');
  }

  // Block unverified logins (except pre-configured admin accounts if verified)
  if (user.role !== 'admin' && !user.isVerified) {
    throw new ApiError(403, 'Please verify your official college email address before logging in.', {
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    });
  }

  const profile = await loadProfile(user);
  res.json({ success: true, token: generateToken(user._id), user, profile });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const profile = await loadProfile(req.user);
  res.json({ success: true, user: req.user, profile });
});

// GET /api/auth/demo-accounts
// Safe endpoint reporting available verified development demo accounts
exports.getDemoAccounts = asyncHandler(async (_req, res) => {
  if (env.nodeEnv === 'production' && !process.env.ALLOW_DEMO_ACCOUNTS) {
    return res.json({ success: true, demoAvailable: false, accounts: [] });
  }

  res.json({
    success: true,
    demoAvailable: true,
    accounts: [
      { role: 'student', label: 'Student', email: 'student@kkwagh.edu.in' },
      { role: 'alumni', label: 'Alumnus', email: 'alumni@kkwagh.edu.in' },
      { role: 'teacher', label: 'Placement Office / Guide', email: 'guide@kkwagh.edu.in' },
      { role: 'admin', label: 'Administrator', email: process.env.ADMIN_EMAIL || 'admin@kkwagh.edu.in' },
    ],
  });
});

// GET /api/auth/smtp-status
// Checks SMTP configuration and connection status (admin or diagnostic)
exports.getSmtpStatus = asyncHandler(async (_req, res) => {
  const result = await testSmtpConnection();
  res.json({ success: true, smtp: result });
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (_req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});
