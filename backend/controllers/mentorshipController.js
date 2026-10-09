const MentorshipRequest = require('../models/MentorshipRequest');
const AlumniProfile = require('../models/AlumniProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId } = require('../utils/helpers');
const { notify } = require('../utils/notify');
const { withPeople } = require('../utils/people');

// POST /api/mentorship   (students)
exports.createRequest = asyncHandler(async (req, res) => {
  const { alumniId, topic, message, goals } = req.body;
  assertId(alumniId, 'alumniId');
  if (!topic || !message) throw new ApiError(400, 'Topic and message are required');

  const profile = await AlumniProfile.findOne({ user: alumniId });
  if (!profile || profile.verificationStatus !== 'verified') throw new ApiError(404, 'Verified alumni not found');
  if (!profile.availableForMentorship) throw new ApiError(400, 'This alumnus is not currently available for mentorship');

  const open = await MentorshipRequest.findOne({ student: req.user._id, alumni: alumniId, status: { $in: ['pending', 'accepted'] } });
  if (open) throw new ApiError(409, 'You already have an open mentorship request with this alumnus');

  const request = await MentorshipRequest.create({ student: req.user._id, alumni: alumniId, topic, message, goals });
  await notify(alumniId, {
    type: 'mentorship_request',
    title: 'New mentorship request',
    body: `${req.user.name} requested mentorship on "${topic}".`,
    link: '/mentors',
  });
  res.status(201).json({ success: true, data: request });
});

// GET /api/mentorship  (students: sent, alumni: received, admin: all)
exports.listRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.user.role === 'alumni') filter.alumni = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const docs = await MentorshipRequest.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: await withPeople(docs, ['student', 'alumni']) });
});

// PUT /api/mentorship/:id
//   alumni: { status: accepted|rejected|completed, response }
//   student: { status: cancelled } while still pending
exports.updateRequest = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const { status, response } = req.body;
  const request = await MentorshipRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found');

  const isAlumni = String(request.alumni) === String(req.user._id);
  const isStudent = String(request.student) === String(req.user._id);

  if (isAlumni) {
    if (!['accepted', 'rejected', 'completed'].includes(status)) throw new ApiError(400, 'Invalid status');
    if (status === 'completed' && request.status !== 'accepted') throw new ApiError(400, 'Only accepted mentorships can be completed');
    if (status !== 'completed' && request.status !== 'pending') throw new ApiError(400, `Request already ${request.status}`);
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
      type: 'mentorship_update',
      title: `Mentorship request ${status}`,
      body: `${req.user.name} ${status} your mentorship request on "${request.topic}".`,
      link: '/mentors',
    });
  }
  res.json({ success: true, data: request });
});
