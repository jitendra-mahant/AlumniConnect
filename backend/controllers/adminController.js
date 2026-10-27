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
const AdminAuditLog = require('../models/AdminAuditLog');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const crypto = require('crypto');
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
    pendingRecoveryRequests,
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
    PasswordResetRequest.countDocuments({ status: 'pending' }),
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
      pendingRecoveryRequests,
      topCompanies: topCompanies.map((c) => ({ name: c._id, count: c.count })),
      topDomains: topDomains.map((c) => ({ name: c._id, count: c.count })),
      alumniByYear: byYear.map((c) => ({ year: c._id, count: c.count })),
    },
  });
});

// GET /api/admin/users?q=&role=&status=&verificationStatus=&page=
exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
  if (req.query.isVerified !== undefined) filter.isVerified = req.query.isVerified === 'true';
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

// PUT /api/admin/users/:id   { status: active|suspended, verificationStatus: pending|verified|rejected }
exports.updateUser = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const { status, verificationStatus } = req.body;
  if (status && !['active', 'suspended'].includes(status)) throw new ApiError(400, 'Status must be active or suspended');
  if (verificationStatus && !['pending', 'verified', 'rejected'].includes(verificationStatus)) {
    throw new ApiError(400, 'Verification status must be pending, verified, or rejected');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be modified here');
  if (status) user.status = status;
  if (verificationStatus) {
    user.verificationStatus = verificationStatus;
    user.isVerified = verificationStatus === 'verified';
    if (user.role === 'alumni') {
      await AlumniProfile.updateOne({ user: user._id }, { $set: { verificationStatus } });
    }
  }
  await user.save();
  res.json({ success: true, data: user });
});

// PUT /api/admin/users/:id/verify  { status: verified|rejected|pending, note }
exports.verifyUser = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'user id');
  const { status, note } = req.body;
  if (!['verified', 'rejected', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be verified, rejected, or pending.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be verified or modified here');

  user.verificationStatus = status;
  user.verificationNote = note || '';
  user.isVerified = status === 'verified';
  user.verifiedAt = status === 'verified' ? new Date() : undefined;
  user.verifiedBy = req.user._id;
  await user.save();

  // If user is alumni, keep AlumniProfile in sync
  if (user.role === 'alumni') {
    const profile = await AlumniProfile.findOne({ user: user._id });
    if (profile) {
      profile.verificationStatus = status;
      profile.verificationNote = note || '';
      profile.verifiedAt = status === 'verified' ? new Date() : undefined;
      await profile.save();
    }
  }

  invalidate();

  try {
    const { emitToUser } = require('../socket');
    emitToUser(user._id, 'user:verified', { verificationStatus: status });
  } catch (_) {}

  if (status !== 'pending') {
    await notify(user._id, {
      type: 'verification',
      title: status === 'verified' ? 'Account Verified by Administrator' : 'Account Verification Needs Review',
      body:
        status === 'verified'
          ? 'Your account has been approved by the college administrator. You now have full access to AlumniConnect.'
          : `Your account verification was not approved${note ? `: ${note}` : '.'} Please contact the administrator.`,
      link: status === 'verified' ? '/dashboard' : '/pending-verification',
    });
  }

  res.json({ success: true, message: `User account marked as ${status}`, data: user });
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

  // Also sync the associated User document
  const user = await User.findById(profile.user);
  if (user) {
    user.verificationStatus = status;
    user.verificationNote = note || '';
    user.isVerified = status === 'verified';
    user.verifiedAt = status === 'verified' ? new Date() : undefined;
    user.verifiedBy = req.user._id;
    await user.save();
  }

  invalidate();

  try {
    const { emitToUser } = require('../socket');
    emitToUser(profile.user, 'user:verified', { verificationStatus: status });
  } catch (_) {}

  if (status !== 'pending') {
    await notify(profile.user, {
      type: 'verification',
      title: status === 'verified' ? 'You are now a Verified Alumnus' : 'Profile needs changes',
      body:
        status === 'verified'
          ? 'Your profile is visible to students in the alumni directory.'
          : `Your profile was not approved${note ? `: ${note}` : '.'} Please update it and resubmit.`,
      link: status === 'verified' ? '/dashboard' : '/pending-verification',
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
  const [alumni, companies, jobs, students, questions, mentors] = await Promise.all([
    AlumniProfile.countDocuments({ verificationStatus: 'verified' }),
    AlumniProfile.distinct('currentCompany', { verificationStatus: 'verified' }),
    Job.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'student' }),
    Question.countDocuments({ isHidden: false }),
    AlumniProfile.countDocuments({ verificationStatus: 'verified', availableForMentorship: true }),
  ]);
  res.json({
    success: true,
    data: { alumni, companies: companies.length, jobs, students, questions, mentors },
  });
});

// GET /api/admin/email-status
exports.emailStatus = asyncHandler(async (_req, res) => {
  const { testSmtpConnection } = require('../utils/emailService');
  const status = await testSmtpConnection();
  res.json({ success: true, data: status });
});

// POST /api/admin/test-email
exports.sendTestEmail = asyncHandler(async (req, res) => {
  const { sendNotificationEmail } = require('../utils/emailService');
  const targetEmail = req.body.to || req.user.email;
  if (!targetEmail) throw new ApiError(400, 'Target email address is required');

  const result = await sendNotificationEmail(targetEmail, {
    subject: 'AlumniConnect KKWAGH — Test Email Notification',
    title: 'SMTP Configuration Test',
    body: 'This is a test notification confirming that email delivery is correctly configured on your AlumniConnect instance for K.K. Wagh Institute of Engineering Education & Research.',
    actionUrl: '/admin',
    actionText: 'Go to Admin Dashboard',
  });

  res.json({
    success: result.success,
    delivered: result.delivered,
    mode: result.mode,
    message: result.delivered
      ? `Test email delivered successfully to ${targetEmail}`
      : `Test email processed in development mode (${result.mode}). See server logs for details.`,
    error: result.error,
  });
});

// GET /api/admin/reports/summary
// Comprehensive metrics on alumni dataset by year or all years, company breakdowns, missing fields, and company name variants
exports.reportSummary = asyncHandler(async (req, res) => {
  const yearQuery = req.query.year;
  const matchFilter = {};

  if (yearQuery && yearQuery !== 'all') {
    const yr = Number(yearQuery);
    if (!Number.isNaN(yr)) {
      matchFilter.$or = [{ graduationYear: yr }, { importBatch: String(yr) }, { batch: String(yr) }];
    }
  }

  const [
    totalAlumni,
    missingCompany,
    missingRole,
    awaitingVerification,
    linkedinConfirmed,
    linkedinPrivate,
    companyAggr,
    allYearsRaw,
    auditLogs,
  ] = await Promise.all([
    AlumniProfile.countDocuments(matchFilter),
    AlumniProfile.countDocuments({
      ...matchFilter,
      $or: [{ currentCompany: 'Company Not Specified' }, { currentCompany: '' }, { currentCompany: null }],
    }),
    AlumniProfile.countDocuments({
      ...matchFilter,
      $or: [{ currentJobTitle: 'Role Not Specified' }, { currentJobTitle: '' }, { currentJobTitle: null }],
    }),
    AlumniProfile.countDocuments({ ...matchFilter, verificationStatus: 'pending' }),
    AlumniProfile.countDocuments({ ...matchFilter, linkedinConfirmed: true }),
    AlumniProfile.countDocuments({ ...matchFilter, linkedinVisibility: 'private' }),
    AlumniProfile.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$currentCompany', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    AlumniProfile.distinct('graduationYear'),
    AdminAuditLog.find({ targetType: { $in: ['alumni_record', 'company_standardization'] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const availableYears = allYearsRaw.filter((y) => y && !Number.isNaN(y)).sort((a, b) => b - a);

  // Detect company name spelling variants (e.g. "FinIQ" vs "FiniQ Consulting", "Vegyan" vs "Vegayan")
  const knownVariantGroups = [
    { canonical: 'FinIQ', variants: ['FinIQ', 'FiniQ', 'FiniQ Consulting'] },
    { canonical: 'Vegayan Systems', variants: ['Vegyan Systems', 'Vegayan Systems'] },
  ];

  const variantsDetected = [];
  const compMap = new Map(companyAggr.map((c) => [c._id, c.count]));

  for (const group of knownVariantGroups) {
    const presentVariants = group.variants
      .filter((v) => compMap.has(v))
      .map((v) => ({ name: v, count: compMap.get(v) }));

    if (presentVariants.length > 1) {
      variantsDetected.push({
        canonical: group.canonical,
        variants: presentVariants,
        totalCombined: presentVariants.reduce((sum, v) => sum + v.count, 0),
      });
    }
  }

  res.json({
    success: true,
    data: {
      selectedYear: yearQuery || 'all',
      totalAlumni,
      total2022: totalAlumni, // backward compatibility
      missingCompany,
      missingRole,
      awaitingVerification,
      linkedinConfirmed,
      linkedinPrivate,
      companyCounts: companyAggr.map((c) => ({ company: c._id || 'Company Not Specified', count: c.count })),
      companyVariants: variantsDetected,
      availableYears,
      recentAuditLogs: auditLogs,
    },
  });
});

// GET /api/admin/alumni-2022/summary (backward compatibility alias)
exports.alumni2022Summary = exports.reportSummary;

// GET /api/admin/data-cleanup/dry-run
exports.dataCleanupDryRun = asyncHandler(async (_req, res) => {
  const { generateDryRunReport } = require('../services/cleanupService');
  const report = await generateDryRunReport();
  res.json({ success: true, data: report });
});

// POST /api/admin/data-cleanup/execute
exports.dataCleanupExecute = asyncHandler(async (req, res) => {
  const { executeAlumniCleanup } = require('../services/cleanupService');
  const result = await executeAlumniCleanup(req.user);
  res.json({ success: true, data: result });
});

// GET /api/admin/alumni-2022/summary
// Comprehensive metrics on 2022 Alumni, company breakdowns, missing fields, and company name variants
exports.alumni2022Summary = asyncHandler(async (_req, res) => {
  const match2022 = {
    $or: [{ graduationYear: 2022 }, { importBatch: '2022' }, { batch: '2022' }],
  };

  const [
    total2022,
    missingCompany,
    missingRole,
    awaitingVerification,
    linkedinConfirmed,
    linkedinPrivate,
    companyAggr,
    auditLogs,
  ] = await Promise.all([
    AlumniProfile.countDocuments(match2022),
    AlumniProfile.countDocuments({ ...match2022, currentCompany: 'Company Not Specified' }),
    AlumniProfile.countDocuments({ ...match2022, currentJobTitle: 'Role Not Specified' }),
    AlumniProfile.countDocuments({ ...match2022, verificationStatus: 'pending' }),
    AlumniProfile.countDocuments({ ...match2022, linkedinConfirmed: true }),
    AlumniProfile.countDocuments({ ...match2022, linkedinVisibility: 'private' }),
    AlumniProfile.aggregate([
      { $match: match2022 },
      { $group: { _id: '$currentCompany', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    AdminAuditLog.find({ targetType: { $in: ['alumni_record', 'company_standardization'] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  // Detect company name spelling variants (e.g. "FinIQ" vs "FiniQ Consulting", "Vegyan" vs "Vegayan")
  const knownVariantGroups = [
    { canonical: 'FinIQ', variants: ['FinIQ', 'FiniQ', 'FiniQ Consulting'] },
    { canonical: 'Vegayan Systems', variants: ['Vegyan Systems', 'Vegayan Systems'] },
  ];

  const variantsDetected = [];
  const compMap = new Map(companyAggr.map((c) => [c._id, c.count]));

  for (const group of knownVariantGroups) {
    const presentVariants = group.variants
      .filter((v) => compMap.has(v))
      .map((v) => ({ name: v, count: compMap.get(v) }));

    if (presentVariants.length > 1) {
      variantsDetected.push({
        canonical: group.canonical,
        variants: presentVariants,
        totalCombined: presentVariants.reduce((sum, v) => sum + v.count, 0),
      });
    }
  }

  res.json({
    success: true,
    data: {
      total2022,
      missingCompany,
      missingRole,
      awaitingVerification,
      linkedinConfirmed,
      linkedinPrivate,
      companyCounts: companyAggr.map((c) => ({ company: c._id, count: c.count })),
      companyVariants: variantsDetected,
      recentAuditLogs: auditLogs,
    },
  });
});

// PUT /api/admin/alumni-2022/correct-company
// Standardize company variant across alumni records and record administrative audit entry
exports.correctCompanyVariant = asyncHandler(async (req, res) => {
  const { fromCompany, toCompany } = req.body;
  if (!fromCompany || !toCompany || !fromCompany.trim() || !toCompany.trim()) {
    throw new ApiError(400, 'Both fromCompany and toCompany are required');
  }

  const result = await AlumniProfile.updateMany(
    { currentCompany: fromCompany.trim() },
    { $set: { currentCompany: toCompany.trim() } }
  );

  await AdminAuditLog.create({
    admin: req.user._id,
    adminEmail: req.user.email,
    action: 'company_standardization',
    targetType: 'company_standardization',
    details: `Standardized company name from "${fromCompany.trim()}" to "${toCompany.trim()}" across ${result.modifiedCount} records.`,
  });

  res.json({
    success: true,
    modifiedCount: result.modifiedCount,
    message: `Updated ${result.modifiedCount} records from "${fromCompany}" to "${toCompany}"`,
  });
});

// GET /api/admin/export/alumni
// Export alumni data as CSV (Excel compatible with UTF-8 BOM) or JSON (strictly zero phone numbers)
exports.exportAlumni = asyncHandler(async (req, res) => {
  const filter = {};
  const yearParam = req.query.year || req.query.batch || req.query.graduationYear;
  if (yearParam && yearParam !== 'all') {
    const yr = Number(yearParam);
    if (!Number.isNaN(yr)) {
      filter.$or = [{ graduationYear: yr }, { batch: String(yr) }, { importBatch: String(yr) }];
    }
  }
  if (req.query.company) {
    filter.currentCompany = new RegExp(escapeRegex(req.query.company), 'i');
  }

  const profiles = await AlumniProfile.find(filter).sort({ currentCompany: 1, fullName: 1 }).lean();

  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'json') {
    const sanitized = profiles.map((p) => {
      const copy = { ...p };
      delete copy.phone;
      delete copy.secondary_phone;
      delete copy.secondaryPhone;
      return copy;
    });
    return res.json({ success: true, count: sanitized.length, data: sanitized });
  }

  // Generate Excel-friendly CSV with UTF-8 BOM (\uFEFF)
  const headers = [
    'Full Name',
    'Current Company',
    'Job Role',
    'Graduation Batch',
    'Department',
    'Degree',
    'Verification Status',
    'LinkedIn Visibility',
    'LinkedIn URL',
    'Contact Email',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = profiles.map((p) => [
    escapeCsv(p.fullName),
    escapeCsv(p.currentCompany),
    escapeCsv(p.currentJobTitle),
    escapeCsv(p.batch || p.graduationYear || 'Not Specified'),
    escapeCsv(p.department),
    escapeCsv(p.degree),
    escapeCsv(p.verificationStatus),
    escapeCsv(p.linkedinVisibility || 'private'),
    escapeCsv(p.linkedinUrl || ''),
    escapeCsv(p.email || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const batchLabel = (yearParam && yearParam !== 'all') ? `Batch_${yearParam}` : 'All_Years';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="KKWAGH_Alumni_${batchLabel}_Report.csv"`
  );
  res.send(csvContent);
});

// GET /api/admin/recovery-requests
// List pending and historical administrator-assisted password recovery requests
exports.listRecoveryRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(parseInt(limit, 10) || 50, 100);

  const [total, requests, pendingCount] = await Promise.all([
    PasswordResetRequest.countDocuments(filter),
    PasswordResetRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .populate('user', 'name email role institution')
      .populate('approvedBy', 'name email')
      .lean(),
    PasswordResetRequest.countDocuments({ status: 'pending' }),
  ]);

  res.json({
    success: true,
    total,
    pendingCount,
    page: p,
    pages: Math.max(Math.ceil(total / l), 1),
    data: requests,
  });
});

// PUT /api/admin/recovery-requests/:id/approve
// Approves recovery request and generates secure temporary credential
exports.approveRecoveryRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await PasswordResetRequest.findById(id).populate('user');
  if (!request) throw new ApiError(404, 'Recovery request not found');

  if (request.status === 'completed') {
    throw new ApiError(400, 'This recovery request has already been completed.');
  }

  const targetUserId = request.user?._id || request.user;
  let user = targetUserId ? await User.findById(targetUserId).select('+password') : null;
  if (!user && request.email) {
    user = await User.findOne({ email: request.email.toLowerCase() }).select('+password');
  }
  if (!user) throw new ApiError(404, 'Target user account no longer exists');

  // Generate secure random temporary credential (e.g. KKWAGH#4B9F2A@721)
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const randomCode = Math.floor(100 + Math.random() * 900);
  const tempCredential = `KKWAGH#${randomSuffix}@${randomCode}`;

  // Store password in user record (pre-save hook hashes with bcrypt salt 12)
  user.password = tempCredential;
  user.mustChangePassword = true;
  await user.save();

  request.status = 'approved';
  request.approvedBy = req.user._id;
  request.approvedAt = new Date();
  request.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours validity
  await request.save();

  // Audit Logging
  await AdminAuditLog.create({
    admin: req.user._id,
    adminEmail: req.user.email,
    action: 'APPROVE_PASSWORD_RECOVERY',
    targetType: 'user_password_recovery',
    targetId: String(user._id),
    details: `Approved password recovery for ${user.email}. Temporary credential generated.`,
    ipAddress: req.ip || '',
  });

  // Notify user
  await notify(user._id, {
    type: 'recovery_approved',
    title: 'Password Recovery Approved',
    body: 'Your administrator has approved your password recovery request. Log in with your temporary credential to choose a new permanent password.',
    link: '/login',
  });

  // Return temporary credential ONLY to the authorized administrator
  res.json({
    success: true,
    message: 'Password recovery request approved successfully.',
    temporaryCredential: tempCredential,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    expiresAt: request.expiresAt,
  });
});

// PUT /api/admin/recovery-requests/:id/reject
// Rejects password recovery request
exports.rejectRecoveryRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const request = await PasswordResetRequest.findById(id).populate('user');
  if (!request) throw new ApiError(404, 'Recovery request not found');

  request.status = 'rejected';
  request.rejectedReason = reason ? String(reason).trim() : 'Rejected by administrator';
  await request.save();

  const userId = request.user?._id || request.user;
  if (userId) {
    await AdminAuditLog.create({
      admin: req.user._id,
      adminEmail: req.user.email,
      action: 'REJECT_PASSWORD_RECOVERY',
      targetType: 'user_password_recovery',
      targetId: String(userId),
      details: `Rejected password recovery for request ${id}: ${request.rejectedReason}`,
      ipAddress: req.ip || '',
    });

    await notify(userId, {
      type: 'recovery_rejected',
      title: 'Password Recovery Request Update',
      body: `Your password recovery request was not approved: ${request.rejectedReason}`,
      link: '/forgot-password',
    });
  }

  res.json({
    success: true,
    message: 'Password recovery request rejected.',
  });
});
