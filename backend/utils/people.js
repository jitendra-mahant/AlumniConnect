const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

/**
 * Builds a map userId -> display info (name, photo, headline, role, profileId)
 * so list endpoints can show people without exposing sensitive user fields.
 */
async function getDisplayMap(userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return {};

  const [users, alumni, students] = await Promise.all([
    User.find({ _id: { $in: ids } }).select('name role').lean(),
    AlumniProfile.find({ user: { $in: ids } })
      .select('user fullName profilePhoto currentJobTitle currentCompany graduationYear verificationStatus')
      .lean(),
    StudentProfile.find({ user: { $in: ids } }).select('user fullName profilePhoto department graduationYear').lean(),
  ]);

  const map = {};
  users.forEach((u) => {
    map[u._id] = { id: u._id, name: u.name, role: u.role, photo: '', headline: '' };
  });
  alumni.forEach((a) => {
    map[a.user] = {
      ...(map[a.user] || { id: a.user, role: 'alumni' }),
      name: a.fullName,
      photo: a.profilePhoto,
      headline: [a.currentJobTitle, a.currentCompany].filter(Boolean).join(' at '),
      graduationYear: a.graduationYear,
      profileId: a._id,
      verified: a.verificationStatus === 'verified',
    };
  });
  students.forEach((s) => {
    map[s.user] = {
      ...(map[s.user] || { id: s.user, role: 'student' }),
      name: s.fullName,
      photo: s.profilePhoto,
      headline: [s.department, s.graduationYear ? `Class of ${s.graduationYear}` : ''].filter(Boolean).join(' · '),
      graduationYear: s.graduationYear,
    };
  });
  return map;
}

// Attach display info for the given user-reference fields onto each plain doc.
async function withPeople(docs, fields) {
  const list = docs.map((d) => (typeof d.toObject === 'function' ? d.toObject() : d));
  const ids = [];
  list.forEach((d) => fields.forEach((f) => d[f] && ids.push(d[f]._id || d[f])));
  const map = await getDisplayMap(ids);
  return list.map((d) => {
    const out = { ...d };
    fields.forEach((f) => {
      const id = String(d[f]?._id || d[f]);
      out[f] = map[id] || { id, name: 'Unknown user' };
    });
    return out;
  });
}

module.exports = { getDisplayMap, withPeople };
