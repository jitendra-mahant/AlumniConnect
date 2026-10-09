const ReferralRequest = require('../models/ReferralRequest');
const AlumniProfile = require('../models/AlumniProfile');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId, isValidId } = require('../utils/helpers');
const { notify } = require('../utils/notify');
const { withPeople } = require('../utils/people');

// POST /api/referrals   (students)
exports.createRequest = asyncHandler(async (req, res) => {
  const { alumniId, jobId, role, message, resumeUrl } = req.body;
  let { company } = req.body;
  assertId(alumniId, 'alumniId');

  const profile = await AlumniProfile.findOne({ user: alumniId });
  if (!profile || profile.verificationStatus !== 'verified') throw new ApiError(404, 'Verified alumni not found');
  if (!profile.availableForReferral) throw new ApiError(400, 'This alumnus is not currently offering referrals');

  let job;
  if (jobId) {
    if (!isValidId(jobId)) throw new ApiError(400, 'Invalid jobId');
    job = await Job.findById(jobId);
    if (!job) throw new ApiError(404, 'Job not found');
  }
  company = company || (job && job.company) || profile.currentCompany;
  const targetRole = role || (job && job.title);
  if (!targetRole || !message) throw new ApiError(400, 'Role and message are required');

  const open = await ReferralRequest.findOne({
    student: req.user._id, alumni: alumniId, role: targetRole, status: { $in: ['pending', 'accepted'] },
  });
  if (open) throw new ApiError(409, 'You already have an open referral request for this role');

  const request = await ReferralRequest.create({
    student: req.user._id, alumni: alumniId, job: job && job._id, company, role: targetRole, message, resumeUrl,
  });
  await notify(alumniId, {
    type: 'referral_request',
    title: 'New referral request',
    body: `${req.user.name} asked for a referral for ${targetRole} at ${company}.`,
    link: '/referrals',
  });
  res.status(201).json({ success: true, data: request });
});

// GET /api/referrals
exports.listRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.user.role === 'alumni') filter.alumni = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const docs = await ReferralRequest.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: await withPeople(docs, ['student', 'alumni']) });
});

// PUT /api/referrals/:id
//   alumni: { status: accepted|rejected|referred, response }
//   student: { status: cancelled } while pending
exports.updateRequest = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const { status, response } = req.body;
  const request = await ReferralRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found');

  const isAlumni = String(request.alumni) === String(req.user._id);
  const isStudent = String(request.student) === String(req.user._id);

  if (isAlumni) {
    if (!['accepted', 'rejected', 'referred'].includes(status)) throw new ApiError(400, 'Invalid status');
    if (status === 'referred' ? !['pending', 'accepted'].includes(request.status) : request.status !== 'pending') {
      throw new ApiError(400, `Request already ${request.status}`);
    }
  } else if (isStudent) {
    if (status !== 'cancelled' || request.status !== 'pending') throw new ApiError(400, 'You can only cancel a pending request');
  } else {
    throw new ApiError(403, 'Not allowed');
  }

  request.status = status;
  if (response !== undefined) request.response = response;
  request.respondedAt = new Date();
  await request.save();

  if (isAlumni) {
    await notify(request.student, {
      type: 'referral_update',
      title: `Referral request ${status}`,
      body: `${req.user.name} ${status} your referral request for ${request.role}.`,
      link: '/referrals',
    });
  }
  res.json({ success: true, data: request });
});
