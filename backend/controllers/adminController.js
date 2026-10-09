const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const Job = require('../models/Job');
const Connection = require('../models/Connection');
const MentorshipRequest = require('../models/MentorshipRequest');
const ReferralRequest = require('../models/ReferralRequest');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId, escapeRegex, isValidId } = require('../utils/helpers');
const { notify } = require('../utils/notify');
const { withPeople } = require('../utils/people');
const { invalidate } = require('../dsa/indexService');

// GET /api/admin/stats
exports.stats = asyncHandler(async (_req, res) => {
  const [
    students, alumni, admins, suspended,
    pending, verified, rejected,
    jobsTotal, jobsActive, internships,
    connections, mentorship, referrals, messages, openReports,
    topCompanies, topDomains, byYear,
    questionsTotal, answersTotal,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'alumni' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ status: 'suspended' }),
    AlumniProfile.countDocuments({ verificationStatus: 'pending' }),
    AlumniProfile.countDocuments({ verificationStatus: 'verified' }),
    AlumniProfile.countDocuments({ verificationStatus: 'rejected' }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'active' }),
    Job.countDocuments({ type: 'internship' }),
    Connection.countDocuments({ status: 'accepted' }),
    MentorshipRequest.countDocuments(),
    ReferralRequest.countDocuments(),
    Message.countDocuments(),
    Report.countDocuments({ status: 'open' }),
    AlumniProfile.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: '$currentCompany', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 6 },
    ]),
    AlumniProfile.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: '$professionalDomain', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 6 },
    ]),
    AlumniProfile.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: '$graduationYear', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 8 },
    ]),
    Question.countDocuments(),
    Answer.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      users: { students, alumni, admins, suspended, total: students + alumni + admins },
      alumniProfiles: { pending, verified, rejected },
      jobs: { total: jobsTotal, active: jobsActive, internships },
      engagement: { connections, mentorshipRequests: mentorship, referralRequests: referrals, messages },
      qa: { questions: questionsTotal, answers: answersTotal },
      openReports,
      topCompanies: topCompanies.map((c) => ({ name: c._id, count: c.count })),
      topDomains: topDomains.map((c) => ({ name: c._id, count: c.count })),
      alumniByYear: byYear.map((c) => ({ year: c._id, count: c.count })),
    },
  });
});

// GET /api/admin/users?q=&role=&status=&page=
exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const re = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  res.json({ success: true, data: users, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

// PUT /api/admin/users/:id   { status: active|suspended }
exports.updateUser = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) throw new ApiError(400, 'Status must be active or suspended');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be modified here');
  user.status = status;
  await user.save();
  res.json({ success: true, data: user });
});

// DELETE /api/admin/users/:id  (removes the user and their owned records)
exports.deleteUser = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be deleted');

  const id = user._id;
  await Promise.all([
    AlumniProfile.deleteOne({ user: id }),
    StudentProfile.deleteOne({ user: id }),
    Connection.deleteMany({ $or: [{ requester: id }, { recipient: id }] }),
    MentorshipRequest.deleteMany({ $or: [{ student: id }, { alumni: id }] }),
    ReferralRequest.deleteMany({ $or: [{ student: id }, { alumni: id }] }),
    Message.deleteMany({ $or: [{ sender: id }, { recipient: id }] }),
    Notification.deleteMany({ user: id }),
    Job.deleteMany({ postedBy: id }),
    Question.deleteMany({ author: id }),
    Answer.deleteMany({ author: id }),
  ]);
  await user.deleteOne();
  invalidate();
  res.json({ success: true, message: 'User and related data deleted' });
});

// GET /api/admin/alumni?status=pending|verified|rejected
exports.listAlumniProfiles = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.verificationStatus = req.query.status;
  const data = await AlumniProfile.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, data });
});

// PUT /api/admin/alumni/:id/verify  { status: verified|rejected|pending, note }
exports.verifyAlumni = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'alumni id');
  const { status, note } = req.body;
  if (!['verified', 'rejected', 'pending'].includes(status)) throw new ApiError(400, 'Invalid status');

  const profile = await AlumniProfile.findById(req.params.id);
  if (!profile) throw new ApiError(404, 'Alumni profile not found');

  profile.verificationStatus = status;
  profile.verificationNote = note;
  profile.verifiedAt = status === 'verified' ? new Date() : undefined;
  await profile.save();
  invalidate();

  if (status !== 'pending') {
    await notify(profile.user, {
      type: 'verification',
      title: status === 'verified' ? 'You are now a Verified Alumnus' : 'Profile needs changes',
      body:
        status === 'verified'
          ? 'Your profile is visible to students in the alumni directory.'
          : `Your profile was not approved${note ? `: ${note}` : '.'} Please update it and resubmit.`,
      link: '/profile',
    });
  }
  res.json({ success: true, data: profile });
});

// GET /api/admin/jobs
exports.listJobs = asyncHandler(async (_req, res) => {
  const docs = await Job.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: await withPeople(docs, ['postedBy']) });
});

// ---- reports ----

const TARGET_MODELS = {
  user: User,
  job: Job,
  message: Message,
  alumni_profile: AlumniProfile,
  question: Question,
  answer: Answer,
};

const targetLabel = (type, doc) => {
  if (!doc) return '(deleted)';
  if (type === 'user') return `${doc.name} (${doc.email})`;
  if (type === 'job') return `${doc.title} at ${doc.company}`;
  if (type === 'alumni_profile') return doc.fullName;
  if (type === 'question') return `Question: ${doc.title}`;
  if (type === 'answer') return `Answer: ${String(doc.body || '').slice(0, 100)}`;
  return String(doc.text || '').slice(0, 120);
};

// POST /api/reports  (any authenticated user)
exports.createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason } = req.body;
  if (!TARGET_MODELS[targetType]) throw new ApiError(400, 'Invalid target type');
  if (!isValidId(targetId)) throw new ApiError(400, 'Invalid target id');
  if (!reason || !reason.trim()) throw new ApiError(400, 'Please describe the issue');
  if (!(await TARGET_MODELS[targetType].exists({ _id: targetId }))) throw new ApiError(404, 'Reported item not found');

  const report = await Report.create({ reporter: req.user._id, targetType, targetId, reason });
  res.status(201).json({ success: true, data: report });
});

// GET /api/admin/reports?status=open
exports.listReports = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(200);
  const withReporter = await withPeople(reports, ['reporter']);
  const data = await Promise.all(
    withReporter.map(async (r) => {
      const doc = await TARGET_MODELS[r.targetType].findById(r.targetId).lean();
      return { ...r, targetLabel: targetLabel(r.targetType, doc) };
    })
  );
  res.json({ success: true, data });
});

// PUT /api/admin/reports/:id  { status: resolved|dismissed|open, adminNote }
exports.updateReport = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const { status, adminNote } = req.body;
  if (!['open', 'resolved', 'dismissed'].includes(status)) throw new ApiError(400, 'Invalid status');
  const report = await Report.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true });
  if (!report) throw new ApiError(404, 'Report not found');
  res.json({ success: true, data: report });
});

// GET /api/public/stats  (landing page numbers, no auth)
exports.publicStats = asyncHandler(async (_req, res) => {
  const [alumni, companies, jobs, students, questions] = await Promise.all([
    AlumniProfile.countDocuments({ verificationStatus: 'verified' }),
    AlumniProfile.distinct('currentCompany', { verificationStatus: 'verified' }),
    Job.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'student' }),
    Question.countDocuments({ isHidden: false }),
  ]);
  res.json({ success: true, data: { alumni, companies: companies.length, jobs, students, questions } });
});
