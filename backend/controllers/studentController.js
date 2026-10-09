const StudentProfile = require('../models/StudentProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { toArray, pick, isSafeUrl } = require('../utils/helpers');

const SCALARS = [
  'fullName', 'profilePhoto', 'college', 'department', 'degree', 'currentYear',
  'graduationYear', 'location', 'careerGoals', 'bio', 'resumeUrl', 'linkedinUrl', 'githubUrl',
];

// GET /api/students/profile
exports.getMyProfile = asyncHandler(async (req, res) => {
  let profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await StudentProfile.create({ user: req.user._id, fullName: req.user.name, college: env.collegeName });
  }
  res.json({ success: true, data: profile });
});

// POST|PUT /api/students/profile  (upsert)
exports.saveProfile = asyncHandler(async (req, res) => {
  let profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) profile = new StudentProfile({ user: req.user._id, fullName: req.user.name, college: env.collegeName });

  const body = pick(req.body, SCALARS);
  // Empty-string numbers would fail casting; treat as "unset".
  ['currentYear', 'graduationYear'].forEach((k) => {
    if (body[k] === '' || body[k] === null) body[k] = undefined;
  });
  for (const urlField of ['resumeUrl', 'linkedinUrl', 'githubUrl']) {
    if (body[urlField] && !isSafeUrl(body[urlField])) {
      throw new ApiError(400, `Invalid URL provided for ${urlField}. Must start with http:// or https://`);
    }
  }
  Object.assign(profile, body);
  ['skills', 'interests'].forEach((f) => {
    if (req.body[f] !== undefined) profile[f] = toArray(req.body[f]);
  });
  if (!profile.fullName) throw new ApiError(400, 'Full name is required');
  await profile.save();
  res.json({ success: true, data: profile });
});
