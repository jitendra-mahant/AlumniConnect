const Job = require('../models/Job');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId, escapeRegex, toArray, toBool, pick } = require('../utils/helpers');
const { notifyMany } = require('../utils/notify');
const { withPeople } = require('../utils/people');
const { rankJobs } = require('../dsa/jobRanking');

const JOB_FIELDS = [
  'title', 'company', 'type', 'domain', 'location', 'workMode', 'description',
  'experienceRequired', 'compensation', 'applyUrl', 'deadline', 'referralAvailable',
];

// POST /api/jobs  (verified alumni or admin)
exports.createJob = asyncHandler(async (req, res) => {
  let defaultCompany;
  if (req.user.role === 'alumni') {
    const profile = await AlumniProfile.findOne({ user: req.user._id });
    if (!profile || profile.verificationStatus !== 'verified') {
      throw new ApiError(403, 'Only verified alumni can post opportunities. Your profile is awaiting verification.');
    }
    defaultCompany = profile.currentCompany;
  }

  const data = pick(req.body, JOB_FIELDS);
  if (!data.company) data.company = defaultCompany;
  if (!data.deadline) delete data.deadline;
  const job = await Job.create({
    ...data,
    requiredSkills: toArray(req.body.requiredSkills),
    postedBy: req.user._id,
  });

  // Notify every active student about the new opportunity.
  const students = await User.find({ role: 'student', status: 'active' }).select('_id').lean();
  await notifyMany(students.map((s) => s._id), {
    type: 'job_posted',
    title: `New ${job.type}: ${job.title}`,
    body: `${job.company}${job.location ? ' · ' + job.location : ''}`,
    link: `/jobs?open=${job._id}`,
  });

  res.status(201).json({ success: true, data: job });
});

// GET /api/jobs?type=&q=&domain=&skill=&location=&mine=true&rank=true&page=&limit=
exports.listJobs = asyncHandler(async (req, res) => {
  const { type, q, domain, skill, location } = req.query;
  const filter = {};
  const and = [];

  if (toBool(req.query.mine) && req.user.role !== 'student') {
    filter.postedBy = req.user._id;
    if (req.query.status) filter.status = req.query.status;
  } else if (req.user.role === 'admin' && req.query.status) {
    filter.status = req.query.status;
  } else {
    filter.status = 'active';
    and.push({ $or: [{ deadline: { $exists: false } }, { deadline: null }, { deadline: { $gte: new Date() } }] });
  }

  if (type && ['job', 'internship'].includes(type)) filter.type = type;
  if (domain) filter.domain = new RegExp(escapeRegex(domain), 'i');
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (skill) filter.requiredSkills = new RegExp(escapeRegex(skill), 'i');
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    and.push({ $or: [{ title: re }, { company: re }, { description: re }, { requiredSkills: re }, { domain: re }] });
  }
  if (and.length) filter.$and = and;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

  let docs = await Job.find(filter).sort({ createdAt: -1 }).limit(300);

  // Students get opportunities ranked by relevance via the priority queue (max-heap).
  const wantsRank = req.user.role === 'student' && req.query.rank !== 'false';
  let list;
  if (wantsRank) {
    const student = await StudentProfile.findOne({ user: req.user._id }).lean();
    list = rankJobs(docs, student || {});
  } else {
    list = docs.map((d) => d.toObject());
  }

  const total = list.length;
  const pageItems = list.slice((page - 1) * limit, page * limit);
  const withPoster = await withPeople(pageItems, ['postedBy']);
  const saved = new Set(req.user.savedJobs.map(String));
  const data = withPoster.map((j) => ({ ...j, saved: saved.has(String(j._id)) }));

  res.json({ success: true, data, total, page, pages: Math.max(Math.ceil(total / limit), 1), ranked: wantsRank });
});

// GET /api/jobs/saved
exports.savedJobs = asyncHandler(async (req, res) => {
  const docs = await Job.find({ _id: { $in: req.user.savedJobs } }).sort({ createdAt: -1 });
  const data = (await withPeople(docs, ['postedBy'])).map((j) => ({ ...j, saved: true }));
  res.json({ success: true, data });
});

// GET /api/jobs/:id
exports.getJob = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'job id');
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  const [data] = await withPeople([job], ['postedBy']);
  res.json({ success: true, data: { ...data, saved: req.user.savedJobs.map(String).includes(String(job._id)) } });
});

// PUT /api/jobs/:id  (poster or admin)
exports.updateJob = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'job id');
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  if (String(job.postedBy) !== String(req.user._id) && req.user.role !== 'admin') throw new ApiError(403, 'Not allowed');

  Object.assign(job, pick(req.body, [...JOB_FIELDS, 'status']));
  if (req.body.requiredSkills !== undefined) job.requiredSkills = toArray(req.body.requiredSkills);
  await job.save();
  res.json({ success: true, data: job });
});

// DELETE /api/jobs/:id  (poster or admin)
exports.deleteJob = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'job id');
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  if (String(job.postedBy) !== String(req.user._id) && req.user.role !== 'admin') throw new ApiError(403, 'Not allowed');
  await job.deleteOne();
  res.json({ success: true, message: 'Job deleted' });
});

// POST /api/jobs/:id/save  (toggle)
exports.toggleSave = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'job id');
  const job = await Job.findById(req.params.id).select('_id');
  if (!job) throw new ApiError(404, 'Job not found');

  const has = req.user.savedJobs.map(String).includes(String(job._id));
  await User.updateOne(
    { _id: req.user._id },
    has ? { $pull: { savedJobs: job._id } } : { $addToSet: { savedJobs: job._id } }
  );
  res.json({ success: true, saved: !has });
});
