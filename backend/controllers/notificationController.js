const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId } = require('../utils/helpers');

// GET /api/notifications
exports.list = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const [data, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, data, unread });
});

// GET /api/notifications/unread-count
exports.unreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, unread });
});

// PUT /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

// PUT /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!n) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: n });
});
