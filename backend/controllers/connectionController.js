const Connection = require('../models/Connection');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId } = require('../utils/helpers');
const { notify } = require('../utils/notify');
const { withPeople, getDisplayMap } = require('../utils/people');
const { buildGraph, shortestPath } = require('../dsa/graph');

// POST /api/connections   (students -> alumni)
exports.createConnection = asyncHandler(async (req, res) => {
  const { recipientId, message } = req.body;
  assertId(recipientId, 'recipientId');
  if (String(recipientId) === String(req.user._id)) throw new ApiError(400, 'You cannot connect with yourself');

  const recipient = await User.findById(recipientId);
  const profile = recipient && (await AlumniProfile.findOne({ user: recipientId }));
  if (!recipient || recipient.role !== 'alumni' || !profile || profile.verificationStatus !== 'verified') {
    throw new ApiError(404, 'Verified alumni not found');
  }

  const existing = await Connection.findOne({
    $or: [
      { requester: req.user._id, recipient: recipientId },
      { requester: recipientId, recipient: req.user._id },
    ],
  });

  let connection;
  if (existing) {
    const mine = String(existing.requester) === String(req.user._id);
    if (existing.status === 'rejected' && mine) {
      // Allow re-sending after a rejection.
      existing.status = 'pending';
      existing.message = message;
      existing.respondedAt = undefined;
      connection = await existing.save();
    } else {
      throw new ApiError(409, `A connection already exists (${existing.status})`);
    }
  } else {
    connection = await Connection.create({ requester: req.user._id, recipient: recipientId, message });
  }

  await notify(recipientId, {
    type: 'connection_request',
    title: 'New connection request',
    body: `${req.user.name} wants to connect with you.`,
    link: '/dashboard',
  });
  res.status(201).json({ success: true, data: connection });
});

// GET /api/connections?status=accepted|pending|rejected
exports.listConnections = asyncHandler(async (req, res) => {
  const filter = { $or: [{ requester: req.user._id }, { recipient: req.user._id }] };
  if (req.query.status) filter.status = req.query.status;
  const docs = await Connection.find(filter).sort({ updatedAt: -1 });
  const data = (await withPeople(docs, ['requester', 'recipient'])).map((c) => ({
    ...c,
    direction: String(c.requester.id) === String(req.user._id) ? 'sent' : 'received',
  }));
  res.json({ success: true, data });
});

// PUT /api/connections/:id   { status: 'accepted' | 'rejected' }   (recipient only)
exports.respondToConnection = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) throw new ApiError(400, 'Status must be accepted or rejected');

  const connection = await Connection.findById(req.params.id);
  if (!connection) throw new ApiError(404, 'Connection not found');
  if (String(connection.recipient) !== String(req.user._id)) throw new ApiError(403, 'Only the recipient can respond');
  if (connection.status !== 'pending') throw new ApiError(400, `Request already ${connection.status}`);

  connection.status = status;
  connection.respondedAt = new Date();
  await connection.save();

  await notify(connection.requester, {
    type: status === 'accepted' ? 'connection_accepted' : 'connection_rejected',
    title: status === 'accepted' ? 'Connection accepted' : 'Connection declined',
    body: `${req.user.name} ${status} your connection request.`,
    link: '/dashboard',
  });
  res.json({ success: true, data: connection });
});

// GET /api/connections/path/:userId  -> BFS shortest path through accepted connections
exports.connectionPath = asyncHandler(async (req, res) => {
  assertId(req.params.userId, 'userId');
  const edges = await Connection.find({ status: 'accepted' }).select('requester recipient').lean();
  const adj = buildGraph(edges.map((e) => [e.requester, e.recipient]));
  const path = shortestPath(adj, req.user._id, req.params.userId);
  if (!path) return res.json({ success: true, degrees: null, path: [] });

  const map = await getDisplayMap(path);
  res.json({
    success: true,
    degrees: path.length - 1,
    path: path.map((id) => map[id] || { id, name: 'Unknown' }),
  });
});
