const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('./emailService');

// Notification types that warrant an email alert to the recipient
const EMAIL_ALERT_TYPES = new Set([
  'connection_request',
  'mentorship_request',
  'mentorship_update',
  'referral_request',
  'referral_update',
  'verification',
  'profile_review',
]);

// Create a single notification. Never throws: a failed notification must not break the main action.
async function notify(userId, { type, title, body, link, sendEmailAlert = true }) {
  try {
    const notif = await Notification.create({ user: userId, type, title, body, link });

    // Emit live real-time notification to user's socket room if active
    try {
      const { emitToUser } = require('../socket');
      emitToUser(userId, 'notification', notif);
    } catch (_socketErr) {
      // Socket server not yet initialized in tests
    }

    // Send email alert if appropriate
    if (sendEmailAlert && EMAIL_ALERT_TYPES.has(type)) {
      User.findById(userId).select('email name').lean().then((recipient) => {
        if (recipient && recipient.email) {
          sendNotificationEmail(recipient.email, {
            subject: `[AlumniConnect] ${title}`,
            title,
            body: body || title,
            actionUrl: link,
            actionText: 'View in AlumniConnect',
          }).catch((err) => console.error('[notify email error]', err.message));
        }
      }).catch(() => {});
    }

    return notif;
  } catch (err) {
    console.error('[notify] failed:', err.message);
    return null;
  }
}

async function notifyMany(userIds, payload) {
  try {
    if (!userIds || !userIds.length) return;
    await Notification.insertMany(userIds.map((user) => ({ user, ...payload })));
  } catch (err) {
    console.error('[notifyMany] failed:', err.message);
  }
}

async function notifyRole(role, payload) {
  const users = await User.find({ role, status: 'active' }).select('_id email').lean();
  if (!users.length) return;

  const notifs = users.map((u) => ({ user: u._id, ...payload }));
  await Notification.insertMany(notifs);

  if (EMAIL_ALERT_TYPES.has(payload.type)) {
    users.forEach((u) => {
      if (u.email) {
        sendNotificationEmail(u.email, {
          subject: `[AlumniConnect Admin] ${payload.title}`,
          title: payload.title,
          body: payload.body || payload.title,
          actionUrl: payload.link,
          actionText: 'Open Admin Dashboard',
        }).catch(() => {});
      }
    });
  }
}

module.exports = { notify, notifyMany, notifyRole };
