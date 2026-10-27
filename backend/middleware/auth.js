const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Requires a valid Bearer token; attaches the user document to req.user.
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (_e) {
    throw new ApiError(401, 'Session expired or invalid token. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists.');
  if (user.status === 'suspended') throw new ApiError(403, 'Your account has been suspended.');

  req.user = user;
  next();
});

// Role-based authorization, use after protect.
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

// Verification-based authorization: checks server-side authoritative status.
// Enforces that the user has been approved by an administrator before accessing protected data.
const requireVerified = (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated. Please log in.'));
  }
  // Administrators are inherently authorized
  if (req.user.role === 'admin') {
    return next();
  }
  // Check verification status on authoritative user document
  if (req.user.verificationStatus === 'pending' || req.user.isVerified === false) {
    return next(
      new ApiError(
        403,
        'Your profile is awaiting college administrator verification. You will be notified as soon as it is approved.',
        {
          code: 'PENDING_VERIFICATION',
          verificationStatus: 'pending',
        }
      )
    );
  }
  if (req.user.verificationStatus === 'rejected') {
    return next(
      new ApiError(
        403,
        'Your account verification was rejected by a college administrator.',
        {
          code: 'REJECTED_VERIFICATION',
          verificationStatus: 'rejected',
          verificationNote: req.user.verificationNote,
        }
      )
    );
  }
  next();
};

module.exports = { protect, authorize, requireVerified };
