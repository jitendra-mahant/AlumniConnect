const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const ProjectGroup = require('../models/ProjectGroup');
const StudentProfile = require('../models/StudentProfile');
const AlumniProfile = require('../models/AlumniProfile');
const TeacherProfile = require('../models/TeacherProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId, escapeRegex } = require('../utils/helpers');
const { notify } = require('../utils/notify');
const { getDisplayMap } = require('../utils/people');
const {
  canMessage,
  canOpenDirect,
  getGroupForUser,
  getGroupParticipants,
} = require('../services/messageAccess');

const MESSAGE_LIMIT = 50;

function emitToUser(userId, event, payload) {
  const { getIO } = require('../socket');
  const io = getIO();
  if (io) io.to(`user:${String(userId)}`).emit(event, payload);
}

function emitNewMessage(message, sender, recipientIds) {
  const { getIO } = require('../socket');
  const io = getIO();
  if (!io) return;

  io.to(`conversation:${message.conversationId}`).emit('new_message', message);
  for (const recipientId of recipientIds) {
    io.to(`user:${String(recipientId)}`).emit('new_message_alert', {
      conversationId: message.conversationId,
      message,
      sender: { _id: sender._id, name: sender.name, role: sender.role },
    });
  }
}

async function notifyRecipients(recipientIds, sender, text, conversationId) {
  await Promise.all(
    recipientIds.map((recipientId) =>
      notify(
        recipientId,
        {
          type: 'message',
          title: `New message from ${sender.name}`,
          body: text.slice(0, 100),
          link: `/messages?${conversationId.startsWith('group_') ? `group=${conversationId.slice(6)}` : `with=${sender._id}`}`,
          sendEmailAlert: false,
        }
      )
    )
  );
}

async function createDirectMessage(sender, recipient, text) {
  if (!(await canMessage(sender, recipient))) {
    throw new ApiError(403, 'You are not authorized to message this user.');
  }

  const conversationId = Message.makeConversationId(sender._id, recipient._id);
  const { isUserOnline } = require('../socket');
  const deliveredAt = isUserOnline(recipient._id) ? new Date() : undefined;
  const message = await Message.create({
    conversationId,
    sender: sender._id,
    recipient: recipient._id,
    text,
    deliveredAt,
  });
  emitNewMessage(message, sender, [recipient._id]);
  if (deliveredAt) {
    emitToUser(sender._id, 'message:delivered', { messageId: message._id, deliveredAt });
  }
  await notifyRecipients([recipient._id], sender, text, conversationId);
  return message;
}

async function createGroupMessage(sender, groupId, text) {
  const group = await getGroupForUser(sender, groupId);
  if (!group) throw new ApiError(403, 'You are not a member of this project group.');

  const participants = await getGroupParticipants([group]);
  const recipientIds = (participants.get(String(group._id)) || [])
    .filter((id) => id !== String(sender._id));
  if (!recipientIds.length) {
    throw new ApiError(
      409,
      'This project group has no other active, verified members linked to user accounts. Link registered students before messaging.'
    );
  }
  const conversationId = `group_${group._id}`;
  const message = await Message.create({
    conversationId,
    groupId: group._id,
    sender: sender._id,
    text,
  });
  emitNewMessage(message, sender, recipientIds);
  await notifyRecipients(recipientIds, sender, text, conversationId);
  return message;
}

exports.directory = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 100);
  const role = String(req.query.role || '');
  const allowedRoles = ['student', 'alumni', 'teacher', 'admin'];
  if (role && !allowedRoles.includes(role)) throw new ApiError(400, 'Invalid role filter');

  const userFilter = {
    status: 'active',
    role: role ? role : { $in: allowedRoles },
    $or: [
      { role: 'admin' },
      { isVerified: true, verificationStatus: 'verified' },
    ],
  };
  const profileUserIds = [];
  if (query) {
    const regex = new RegExp(escapeRegex(query), 'i');
    const profileQueries = await Promise.all([
      StudentProfile.find({ $or: [{ fullName: regex }, { department: regex }] }).select('user').limit(100).lean(),
      AlumniProfile.find({ $or: [{ fullName: regex }, { department: regex }] }).select('user').limit(100).lean(),
      TeacherProfile.find({ $or: [{ fullName: regex }, { department: regex }] }).select('user').limit(100).lean(),
    ]);
    profileQueries.flat().forEach((profile) => profile.user && profileUserIds.push(profile.user));
    userFilter.$and = [
      {
        $or: [
          { name: regex },
          { email: regex },
          { _id: { $in: profileUserIds } },
        ],
      },
    ];
  }

  const candidates = await User.find(userFilter).select('_id name role status isVerified verificationStatus').sort({ name: 1 }).limit(100).lean();
  const authorized = [];
  for (const candidate of candidates) {
    if (String(candidate._id) === String(req.user._id)) continue;
    if (await canOpenDirect(req.user, candidate)) {
      authorized.push(candidate);
      if (authorized.length >= 30) break;
    }
  }

  const displayMap = await getDisplayMap(authorized.map((candidate) => candidate._id));
  res.json({
    success: true,
    data: authorized.map((candidate) => ({
      ...(displayMap[String(candidate._id)] || { id: candidate._id, name: candidate.name }),
      role: candidate.role,
    })),
  });
});

exports.openConversation = asyncHandler(async (req, res) => {
  const recipientId = req.body?.recipientId;
  assertId(recipientId, 'recipientId');
  const recipient = await User.findById(recipientId).select('_id name role status isVerified verificationStatus');
  if (!recipient || !(await canMessage(req.user, recipient))) {
    throw new ApiError(403, 'You are not authorized to start a conversation with this user.');
  }
  const displayMap = await getDisplayMap([recipient._id]);
  res.json({
    success: true,
    data: {
      conversationId: Message.makeConversationId(req.user._id, recipient._id),
      user: displayMap[String(recipient._id)] || { id: recipient._id, name: recipient.name, role: recipient.role },
    },
  });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) throw new ApiError(400, 'Message text is required');
  if (text.length > 2000) throw new ApiError(400, 'Messages cannot exceed 2000 characters.');

  let message;
  if (body.groupId) {
    assertId(body.groupId, 'groupId');
    if (body.recipientId) throw new ApiError(400, 'Send to either a user or a group, not both.');
    message = await createGroupMessage(req.user, body.groupId, text);
  } else {
    assertId(body.recipientId, 'recipientId');
    const recipient = await User.findById(body.recipientId).select('_id name role status isVerified verificationStatus');
    if (!recipient || recipient.status !== 'active') throw new ApiError(404, 'Recipient not found');
    message = await createDirectMessage(req.user, recipient, text);
  }
  res.status(201).json({ success: true, data: message });
});

exports.conversations = asyncHandler(async (req, res) => {
  const me = new mongoose.Types.ObjectId(req.user._id);
  const directRows = await Message.aggregate([
    { $match: { groupId: { $exists: false }, $or: [{ sender: me }, { recipient: me }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        last: { $first: '$$ROOT' },
        unread: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$recipient', me] }, { $eq: [{ $ifNull: ['$readAt', null] }, null] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'last.createdAt': -1 } },
    { $limit: 100 },
  ]);
  const otherIds = directRows.map((row) =>
    String(row.last.sender) === String(me) ? row.last.recipient : row.last.sender
  );
  const displayMap = await getDisplayMap(otherIds);
  const direct = directRows.map((row) => {
    const userId = String(row.last.sender) === String(me) ? row.last.recipient : row.last.sender;
    const display = displayMap[String(userId)];
    return {
      conversationId: row._id,
      kind: 'direct',
      user: display || { id: userId, name: 'Unknown user' },
      lastMessage: {
        text: row.last.text,
        createdAt: row.last.createdAt,
        fromMe: String(row.last.sender) === String(me),
        readAt: row.last.readAt,
        deliveredAt: row.last.deliveredAt,
      },
      unread: row.unread,
    };
  });

  const groupFilter = req.user.role === 'admin'
    ? {}
    : {
        $or: [
          { assignedTeacher: me },
          { 'members.student': me },
          ...(req.user.role === 'student' && req.user.email
            ? [{ 'members.email': req.user.email.trim().toLowerCase() }]
            : []),
        ],
      };
  const groups = await ProjectGroup.find(groupFilter).select('title department assignedTeacher members').sort({ updatedAt: -1 }).limit(50).lean();
  const participantsByGroup = await getGroupParticipants(groups);
  const groupIds = groups.map((group) => group._id);
  const groupRows = groupIds.length
    ? await Message.aggregate([
        { $match: { groupId: { $in: groupIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$groupId',
            last: { $first: '$$ROOT' },
            unread: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$sender', me] },
                      { $not: [{ $in: [me, { $ifNull: ['$readBy.user', []] }] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
    : [];
  const groupMap = new Map(groups.map((group) => [String(group._id), group]));
  const groupMessages = await getDisplayMap(groupRows.map((row) => row.last.sender));
  const groupConversations = groupRows.map((row) => {
    const group = groupMap.get(String(row._id));
    return {
      conversationId: `group_${row._id}`,
      kind: 'group',
      group: {
        id: row._id,
        conversationId: `group_${row._id}`,
        title: group?.title || 'Project group',
        department: group?.department,
        memberCount: participantsByGroup.get(String(row._id))?.length || 0,
      },
      user: { id: `group_${row._id}`, name: group?.title || 'Project group', role: 'group' },
      lastMessage: {
        text: `${groupMessages[String(row.last.sender)]?.name || 'Member'}: ${row.last.text}`,
        createdAt: row.last.createdAt,
        fromMe: String(row.last.sender) === String(me),
      },
      unread: row.unread,
    };
  });
  const data = [...direct, ...groupConversations]
    .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt))
    .slice(0, 100);
  res.json({ success: true, data });
});

exports.groups = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? {}
    : {
        $or: [
          { assignedTeacher: req.user._id },
          { 'members.student': req.user._id },
          ...(req.user.role === 'student' && req.user.email
            ? [{ 'members.email': req.user.email.trim().toLowerCase() }]
            : []),
        ],
      };
  const groups = await ProjectGroup.find(filter)
    .select('title department assignedTeacher members')
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  const participantsByGroup = await getGroupParticipants(groups);
  res.json({
    success: true,
    data: groups.map((group) => {
      const conversationId = `group_${group._id}`;
      return {
        id: group._id,
        conversationId,
        title: group.title,
        department: group.department,
        memberCount: participantsByGroup.get(String(group._id))?.length || 0,
      };
    }),
  });
});

exports.thread = asyncHandler(async (req, res) => {
  assertId(req.params.userId, 'userId');
  const peer = await User.findById(req.params.userId).select('_id name role status isVerified verificationStatus');
  if (!peer || !(await canOpenDirect(req.user, peer))) {
    throw new ApiError(403, 'You are not authorized to access this conversation.');
  }

  const filter = { conversationId: Message.makeConversationId(req.user._id, peer._id), groupId: { $exists: false } };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (Number.isNaN(before.getTime())) throw new ApiError(400, 'Invalid message cursor');
    filter.createdAt = { $lt: before };
  }
  const newestFirst = await Message.find(filter).sort({ createdAt: -1 }).limit(MESSAGE_LIMIT).lean();
  const messages = newestFirst.reverse();
  const unreadIds = messages.filter((message) =>
    String(message.recipient) === String(req.user._id) && !message.readAt
  );
  if (unreadIds.length) {
    const readAt = new Date();
    await Message.updateMany(
      { _id: { $in: unreadIds.map((message) => message._id) }, recipient: req.user._id, readAt: null },
      { $set: { readAt } }
    );
    const senderIds = [...new Set(unreadIds.map((message) => String(message.sender)))];
    senderIds.forEach((senderId) =>
      emitToUser(senderId, 'messages:read', {
        conversationId: filter.conversationId,
        readerId: String(req.user._id),
        readAt,
      })
    );
  }

  const displayMap = await getDisplayMap([peer._id]);
  res.json({
    success: true,
    conversationId: filter.conversationId,
    data: messages,
    user: displayMap[String(peer._id)] || null,
    hasMore: newestFirst.length === MESSAGE_LIMIT,
  });
});

exports.groupThread = asyncHandler(async (req, res) => {
  assertId(req.params.groupId, 'groupId');
  const group = await getGroupForUser(req.user, req.params.groupId);
  if (!group) throw new ApiError(403, 'You are not a member of this project group.');
  const filter = { groupId: group._id };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (Number.isNaN(before.getTime())) throw new ApiError(400, 'Invalid message cursor');
    filter.createdAt = { $lt: before };
  }
  const newestFirst = await Message.find(filter).sort({ createdAt: -1 }).limit(MESSAGE_LIMIT).lean();
  const messages = newestFirst.reverse();
  const unreadIds = messages.filter((message) =>
    String(message.sender) !== String(req.user._id) &&
    !message.readBy?.some((entry) => String(entry.user) === String(req.user._id))
  );
  if (unreadIds.length) {
    const readAt = new Date();
    await Message.updateMany(
      { _id: { $in: unreadIds.map((message) => message._id) }, 'readBy.user': { $ne: req.user._id } },
      { $addToSet: { readBy: { user: req.user._id, readAt } } }
    );
    const senderIds = [...new Set(unreadIds.map((message) => String(message.sender)))];
    senderIds.forEach((senderId) =>
      emitToUser(senderId, 'messages:read', {
        conversationId: `group_${group._id}`,
        readerId: String(req.user._id),
        readAt,
      })
    );
  }
  const participantsByGroup = await getGroupParticipants([group]);
  const members = participantsByGroup.get(String(group._id)) || [];
  const unresolvedMemberCount = (group.members || []).filter((member) =>
    !member.student || !mongoose.Types.ObjectId.isValid(member.student)
  ).length;
  if (unresolvedMemberCount) {
    console.warn('[messages] Project group roster entries are missing user references.', {
      groupId: String(group._id),
      unresolvedMemberCount,
    });
  }
  const displayMap = await getDisplayMap(members);
  const conversationId = `group_${group._id}`;
  res.json({
    success: true,
    conversationId,
    data: messages,
    group: {
      id: group._id,
      conversationId,
      title: group.title,
      department: group.department,
      memberCount: members.length,
      members: members.map((id) => displayMap[id]).filter(Boolean),
    },
    hasMore: newestFirst.length === MESSAGE_LIMIT,
  });
});

exports.createDirectMessage = createDirectMessage;
exports.createGroupMessage = createGroupMessage;
