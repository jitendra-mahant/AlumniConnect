const Message = require('../models/Message');
const Connection = require('../models/Connection');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId } = require('../utils/helpers');
const { notify } = require('../utils/notify');
const { getDisplayMap } = require('../utils/people');

/**
 * Messaging rules (keeps the network trusted, avoids spam):
 *  - an accepted connection always allows messaging,
 *  - a student may message an alumnus who is open to student questions,
 *  - anyone may reply once the other person has messaged them.
 */
async function canMessage(sender, recipient) {
  if (!sender || !recipient) return false;
  if (sender.role === 'admin' || recipient.role === 'admin') return false;

  // Teacher <-> Student communication (project guidance & PBL mentoring)
  if (
    (sender.role === 'teacher' && recipient.role === 'student') ||
    (sender.role === 'student' && recipient.role === 'teacher')
  ) {
    return true;
  }

  const connected = await Connection.exists({
    status: 'accepted',
    $or: [
      { requester: sender._id, recipient: recipient._id },
      { requester: recipient._id, recipient: sender._id },
    ],
  });
  if (connected) return true;

  if (await Message.exists({ sender: recipient._id, recipient: sender._id })) return true;

  if (sender.role === 'student' && recipient.role === 'alumni') {
    const profile = await AlumniProfile.findOne({ user: recipient._id }).select('availableForStudentQuestions verificationStatus');
    return !!profile && profile.verificationStatus === 'verified' && profile.availableForStudentQuestions;
  }
  return false;
}

// POST /api/messages  { recipientId, text }
exports.sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, text } = req.body;
  assertId(recipientId, 'recipientId');
  if (!text || !String(text).trim()) throw new ApiError(400, 'Message text is required');

  const recipient = await User.findById(recipientId);
  if (!recipient || recipient.status !== 'active') throw new ApiError(404, 'Recipient not found');
  if (!(await canMessage(req.user, recipient))) {
    throw new ApiError(403, 'You cannot message this user yet. Send a connection request first.');
  }

  const conversationId = Message.makeConversationId(req.user._id, recipient._id);
  const message = await Message.create({
    conversationId,
    sender: req.user._id,
    recipient: recipient._id,
    text,
  });

  // Broadcast real-time message to conversation and user rooms
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new_message', message);
      io.to(`user:${String(recipient._id)}`).emit('new_message_alert', {
        conversationId,
        message,
        sender: { _id: req.user._id, name: req.user.name },
      });
    }
  } catch (_socketErr) {
    // Socket server not available
  }

  await notify(recipient._id, {
    type: 'message',
    title: `New message from ${req.user.name}`,
    body: String(text).slice(0, 100),
    link: `/messages?with=${req.user._id}`,
  });
  res.status(201).json({ success: true, data: message });
});

// GET /api/messages/conversations
exports.conversations = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const rows = await Message.aggregate([
    { $match: { $or: [{ sender: me }, { recipient: me }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        last: { $first: '$$ROOT' },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ['$recipient', me] }, { $eq: [{ $ifNull: ['$readAt', null] }, null] }] }, 1, 0] } },
      },
    },
    { $sort: { 'last.createdAt': -1 } },
  ]);

  const otherId = (m) => (String(m.sender) === String(me) ? m.recipient : m.sender);
  const map = await getDisplayMap(rows.map((r) => otherId(r.last)));
  const data = rows.map((r) => ({
    conversationId: r._id,
    user: map[String(otherId(r.last))] || { id: otherId(r.last), name: 'Unknown user' },
    lastMessage: { text: r.last.text, createdAt: r.last.createdAt, fromMe: String(r.last.sender) === String(me) },
    unread: r.unread,
  }));
  res.json({ success: true, data });
});

// GET /api/messages/:userId  -> thread with a user; marks incoming as read
exports.thread = asyncHandler(async (req, res) => {
  assertId(req.params.userId, 'userId');
  const conversationId = Message.makeConversationId(req.user._id, req.params.userId);
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(300).lean();
  await Message.updateMany({ conversationId, recipient: req.user._id, readAt: null }, { readAt: new Date() });
  const map = await getDisplayMap([req.params.userId]);
  res.json({ success: true, data: messages, user: map[req.params.userId] || null });
});
