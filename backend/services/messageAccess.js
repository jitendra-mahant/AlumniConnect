const mongoose = require('mongoose');
const Connection = require('../models/Connection');
const AlumniProfile = require('../models/AlumniProfile');
const MentorshipRequest = require('../models/MentorshipRequest');
const Message = require('../models/Message');
const ProjectGroup = require('../models/ProjectGroup');
const User = require('../models/User');

const isVerified = (user) =>
  !!user &&
  user.status === 'active' &&
  (user.role === 'admin' ||
    (user.isVerified !== false && user.verificationStatus === 'verified'));

async function belongsToGroup(user, group) {
  if (!user || !group) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && String(group.assignedTeacher) === String(user._id)) return true;
  const participants = await getGroupParticipants([group]);
  return (participants.get(String(group._id)) || []).includes(String(user._id));
}

async function getGroupParticipants(groups) {
  const groupList = Array.isArray(groups) ? groups : [groups];
  const teacherIds = new Set();
  const studentIds = new Set();
  const rosterEmails = new Set();

  groupList.forEach((group) => {
    if (group.assignedTeacher && mongoose.Types.ObjectId.isValid(group.assignedTeacher)) {
      teacherIds.add(String(group.assignedTeacher));
    }
    (group.members || []).forEach((member) => {
      if (member.student && mongoose.Types.ObjectId.isValid(member.student)) {
        studentIds.add(String(member.student));
      }
      if (typeof member.email === 'string' && member.email.trim()) {
        rosterEmails.add(member.email.trim().toLowerCase());
      }
    });
  });

  const filters = [];
  if (teacherIds.size) filters.push({ _id: { $in: [...teacherIds] }, role: 'teacher' });
  if (studentIds.size) filters.push({ _id: { $in: [...studentIds] }, role: 'student' });
  if (rosterEmails.size) filters.push({ email: { $in: [...rosterEmails] }, role: 'student' });

  const users = filters.length
    ? await User.find({
        status: 'active',
        isVerified: { $ne: false },
        verificationStatus: 'verified',
        $or: filters,
      }).select('_id email role').lean()
    : [];
  const activeIds = new Set(users.map((user) => String(user._id)));
  const studentsByEmail = new Map(
    users
      .filter((user) => user.role === 'student')
      .map((user) => [String(user.email).trim().toLowerCase(), String(user._id)])
  );

  return new Map(groupList.map((group) => {
    const participants = new Set();
    if (group.assignedTeacher && activeIds.has(String(group.assignedTeacher))) {
      participants.add(String(group.assignedTeacher));
    }
    (group.members || []).forEach((member) => {
      if (member.student && activeIds.has(String(member.student))) {
        participants.add(String(member.student));
      } else if (typeof member.email === 'string') {
        const studentId = studentsByEmail.get(member.email.trim().toLowerCase());
        if (studentId) participants.add(studentId);
      }
    });
    return [String(group._id), [...participants]];
  }));
}

async function canMessage(sender, recipient) {
  if (!isVerified(sender) || !isVerified(recipient) || String(sender._id) === String(recipient._id)) {
    return false;
  }

  if (sender.role === 'admin') return true;

  if (
    await Message.exists({
      sender: recipient._id,
      recipient: sender._id,
      groupId: { $exists: false },
    })
  ) {
    return true;
  }

  if (recipient.role === 'admin') return false;

  const connected = await Connection.exists({
    status: 'accepted',
    $or: [
      { requester: sender._id, recipient: recipient._id },
      { requester: recipient._id, recipient: sender._id },
    ],
  });
  if (connected) return true;

  if (sender.role === 'teacher' && recipient.role === 'teacher') return true;

  const sharedGroup = await ProjectGroup.exists({
    $or: [
      { assignedTeacher: sender._id, 'members.student': recipient._id },
      { assignedTeacher: recipient._id, 'members.student': sender._id },
      {
        $and: [
          { 'members.student': sender._id },
          { 'members.student': recipient._id },
        ],
      },
    ],
  });
  if (sharedGroup) return true;

  if (sender.role === 'student' && recipient.role === 'alumni') {
    const [profile, mentorship] = await Promise.all([
      AlumniProfile.findOne({ user: recipient._id })
        .select('availableForStudentQuestions verificationStatus')
        .lean(),
      MentorshipRequest.exists({
        student: sender._id,
        alumni: recipient._id,
        status: 'accepted',
      }),
    ]);
    return !!mentorship || !!profile?.availableForStudentQuestions;
  }

  if (sender.role === 'alumni' && recipient.role === 'student') {
    return !!(await MentorshipRequest.exists({
      student: recipient._id,
      alumni: sender._id,
      status: 'accepted',
    }));
  }

  return sender.role === 'alumni' && recipient.role === 'alumni';
}

async function canOpenDirect(sender, recipient) {
  if (!isVerified(sender) || !isVerified(recipient)) return false;
  if (await canMessage(sender, recipient)) return true;
  return !!(await Message.exists({
    conversationId: Message.makeConversationId(sender._id, recipient._id),
    $or: [
      { sender: sender._id, recipient: recipient._id },
      { sender: recipient._id, recipient: sender._id },
    ],
  }));
}

async function getGroupForUser(user, groupId) {
  const group = await ProjectGroup.findById(groupId).select('title department assignedTeacher members').lean();
  if (!group || !(await belongsToGroup(user, group))) return null;
  return group;
}

module.exports = {
  isVerified,
  belongsToGroup,
  canMessage,
  canOpenDirect,
  getGroupForUser,
  getGroupParticipants,
};
