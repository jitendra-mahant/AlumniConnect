const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a single notification. Never throws: a failed notification must not break the main action.
async function notify(userId, { type, title, body, link }) {
  try {
    return await Notification.create({ user: userId, type, title, body, link });
  } catch (err) {
    console.error('[notify] failed:', err.message);
    return null;
  }
}

async function notifyMany(userIds, payload) {
  try {
    if (!userIds.length) return;
    await Notification.insertMany(userIds.map((user) => ({ user, ...payload })));
  } catch (err) {
    console.error('[notifyMany] failed:', err.message);
  }
}

async function notifyRole(role, payload) {
  const users = await User.find({ role, status: 'active' }).select('_id').lean();
  return notifyMany(users.map((u) => u._id), payload);
}

module.exports = { notify, notifyMany, notifyRole };
