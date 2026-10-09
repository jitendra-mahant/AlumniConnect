const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const env = require('../config/env');
const { notifyRole } = require('../utils/notify');

async function loadProfile(user) {
  if (user.role === 'alumni') return AlumniProfile.findOne({ user: user._id });
  if (user.role === 'student') return StudentProfile.findOne({ user: user._id });
  return null;
}

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
  // Admin accounts can never be self-registered.
  if (role && !['student', 'alumni'].includes(role)) throw new ApiError(400, 'Role must be student or alumni');

  const user = await User.create({ name, email, password, role: role || 'student' });

  if (user.role === 'student') {
    await StudentProfile.create({ user: user._id, fullName: user.name, college: env.collegeName });
  } else {
    await notifyRole('admin', {
      type: 'profile_review',
      title: 'New alumni registration',
      body: `${user.name} registered as alumni and will submit a profile for verification.`,
      link: '/admin',
    });
  }

  const profile = await loadProfile(user);
  res.status(201).json({ success: true, token: generateToken(user._id), user, profile });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (user.status === 'suspended') throw new ApiError(403, 'Your account has been suspended.');

  const profile = await loadProfile(user);
  res.json({ success: true, token: generateToken(user._id), user, profile });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const profile = await loadProfile(req.user);
  res.json({ success: true, user: req.user, profile });
});
