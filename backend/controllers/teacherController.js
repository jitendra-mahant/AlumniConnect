const ProjectGroup = require('../models/ProjectGroup');
const TeacherProfile = require('../models/TeacherProfile');
const StudentProfile = require('../models/StudentProfile');
const GuidanceAppointment = require('../models/GuidanceAppointment');
const AlumniProfile = require('../models/AlumniProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../utils/notify');

// GET /api/teacher/profile
exports.getMyProfile = asyncHandler(async (req, res) => {
  let profile = await TeacherProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await TeacherProfile.create({
      user: req.user._id,
      fullName: req.user.name,
      college: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
    });
  }
  res.json({ success: true, data: profile });
});

// PUT /api/teacher/profile
exports.saveProfile = asyncHandler(async (req, res) => {
  let profile = await TeacherProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = new TeacherProfile({ user: req.user._id, fullName: req.user.name });
  }

  const { fullName, department, designation, cabin, officeHours, specialization } = req.body;
  if (fullName) profile.fullName = fullName.trim();
  if (department) profile.department = department.trim();
  if (designation) profile.designation = designation.trim();
  if (cabin) profile.cabin = cabin.trim();
  if (officeHours) profile.officeHours = officeHours.trim();
  if (specialization !== undefined) {
    profile.specialization = Array.isArray(specialization)
      ? specialization
      : String(specialization).split(',').map((s) => s.trim()).filter(Boolean);
  }

  await profile.save();
  res.json({ success: true, message: 'Teacher profile updated successfully', data: profile });
});

// GET /api/teacher/stats
// Comprehensive metrics derived strictly from authorized database records
exports.getStats = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const filter = req.user.role === 'admin' ? {} : { assignedTeacher: teacherId };
  const appointmentFilter = req.user.role === 'admin' ? {} : { guide: teacherId };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [groups, pendingGuidance, upcomingAppointments, recentAppointments] = await Promise.all([
    ProjectGroup.find(filter).lean(),
    GuidanceAppointment.countDocuments({ ...appointmentFilter, status: 'pending' }),
    GuidanceAppointment.countDocuments({
      ...appointmentFilter,
      status: 'confirmed',
      scheduledDate: { $gte: todayStart },
    }),
    GuidanceAppointment.find(appointmentFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  let pendingReviews = 0;
  let approvedMilestones = 0;
  let totalMilestones = 0;
  let atRiskCount = 0;
  const studentSet = new Set();
  const recentActivities = [];

  for (const group of groups) {
    if (group.isAtRisk) atRiskCount++;
    for (const member of group.members || []) {
      if (member.email) studentSet.add(member.email.toLowerCase());
      else if (member.name) studentSet.add(member.name.toLowerCase());
    }
    for (const m of group.milestones || []) {
      totalMilestones++;
      if (m.status === 'submitted') {
        pendingReviews++;
        recentActivities.push({
          type: 'milestone_submitted',
          title: `Milestone submitted in "${group.title}"`,
          description: `${m.title} was submitted for review.`,
          date: m.submittedAt || group.updatedAt,
          groupId: group._id,
        });
      }
      if (m.status === 'approved') approvedMilestones++;
    }
  }

  for (const appt of recentAppointments) {
    recentActivities.push({
      type: 'appointment_update',
      title: `${appt.type.replace(/_/g, ' ').toUpperCase()}: ${appt.studentName}`,
      description: `${appt.topic} · Status: ${appt.status}`,
      date: appt.updatedAt,
      appointmentId: appt._id,
    });
  }

  // Sort activities newest first
  recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    success: true,
    data: {
      totalGroups: groups.length,
      pendingReviews,
      approvedMilestones,
      totalMilestones,
      atRiskGroups: atRiskCount,
      totalStudents: studentSet.size,
      pendingGuidanceRequests: pendingGuidance,
      upcomingAppointments,
      recentActivities: recentActivities.slice(0, 8),
    },
  });
});

// GET /api/teacher/students
// Student management: Returns assigned students across project groups and mentorship sessions
exports.getAssignedStudents = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const filter = req.user.role === 'admin' ? {} : { assignedTeacher: teacherId };

  const [groups, appointments] = await Promise.all([
    ProjectGroup.find(filter).lean(),
    GuidanceAppointment.find(req.user.role === 'admin' ? {} : { guide: teacherId }).lean(),
  ]);

  // Aggregate distinct students
  const studentMap = new Map();

  for (const g of groups) {
    for (const m of g.members || []) {
      const key = (m.email || m.name || '').toLowerCase();
      if (!key) continue;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          name: m.name,
          email: m.email || '',
          rollNumber: m.rollNumber || 'N/A',
          roleInGroup: m.roleInGroup || 'Member',
          projects: [],
          appointmentCount: 0,
          userRef: m.student || null,
        });
      }
      studentMap.get(key).projects.push({
        id: g._id,
        title: g.title,
        progress: g.progress,
        isAtRisk: g.isAtRisk,
      });
    }
  }

  for (const a of appointments) {
    const key = (a.studentEmail || a.studentName || '').toLowerCase();
    if (!key) continue;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        name: a.studentName,
        email: a.studentEmail,
        rollNumber: 'N/A',
        roleInGroup: 'Mentee',
        projects: [],
        appointmentCount: 0,
        userRef: a.student || null,
      });
    }
    studentMap.get(key).appointmentCount += 1;
  }

  // Fetch StudentProfile information for enriched academic and career data
  const emails = Array.from(studentMap.values()).map((s) => s.email).filter(Boolean);
  const users = await User.find({ email: { $in: emails } }).lean();
  const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u]));

  const userIds = users.map((u) => u._id);
  const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean();
  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

  let students = Array.from(studentMap.values()).map((s) => {
    const u = userMap.get(s.email.toLowerCase());
    const p = u ? profileMap.get(String(u._id)) : null;
    return {
      ...s,
      userId: u ? u._id : null,
      department: p?.department || 'Computer Engineering',
      degree: p?.degree || 'B.Tech',
      currentYear: p?.currentYear || 3,
      graduationYear: p?.graduationYear || 2026,
      skills: p?.skills || ['JavaScript', 'React', 'Problem Solving'],
      careerGoals: p?.careerGoals || 'Preparing for software engineering campus placement',
      bio: p?.bio || '',
      resumeUrl: p?.resumeUrl || '',
      githubUrl: p?.githubUrl || '',
    };
  });

  // Search filter
  const { q, department } = req.query;
  if (q && q.trim()) {
    const search = q.trim().toLowerCase();
    students = students.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.rollNumber.toLowerCase().includes(search)
    );
  }

  if (department && department !== 'all') {
    students = students.filter((s) => s.department === department);
  }

  res.json({
    success: true,
    count: students.length,
    data: students,
  });
});

// GET /api/teacher/appointments
// Mentorship and guidance appointments management
exports.getAppointments = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const filter = req.user.role === 'admin' ? {} : { guide: teacherId };

  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  if (req.query.type && req.query.type !== 'all') {
    filter.type = req.query.type;
  }

  const appointments = await GuidanceAppointment.find(filter)
    .sort({ scheduledDate: -1, createdAt: -1 })
    .populate('student', 'name email role institution')
    .lean();

  res.json({ success: true, count: appointments.length, data: appointments });
});

// POST /api/teacher/appointments
// Schedule a guidance appointment
exports.createAppointment = asyncHandler(async (req, res) => {
  const { studentEmail, studentName, type, topic, notes, scheduledDate, scheduledTime, location } = req.body;
  if (!studentEmail || !topic || !scheduledDate) {
    throw new ApiError(400, 'Student email, guidance topic, and scheduled date are required');
  }

  const normalized = String(studentEmail).trim().toLowerCase();
  let studentUser = await User.findOne({ email: normalized });
  if (!studentUser) {
    // Check if student exists in another record or create placeholder link
    studentUser = req.user; // Fallback reference
  }

  const appointment = await GuidanceAppointment.create({
    guide: req.user._id,
    student: studentUser._id,
    studentName: studentName ? studentName.trim() : studentUser.name || 'Student',
    studentEmail: normalized,
    type: type || 'project_guidance',
    topic: topic.trim(),
    notes: notes ? notes.trim() : '',
    scheduledDate: new Date(scheduledDate),
    scheduledTime: scheduledTime ? scheduledTime.trim() : '10:00 AM - 10:30 AM',
    location: location ? location.trim() : 'Placement Office & Faculty Cabin, KKWAGH',
    status: 'confirmed',
  });

  if (studentUser && studentUser._id.toString() !== req.user._id.toString()) {
    await notify(studentUser._id, {
      type: 'appointment_scheduled',
      title: 'Guidance Appointment Scheduled',
      body: `Your guide scheduled a session: "${appointment.topic}" on ${new Date(scheduledDate).toLocaleDateString()}.`,
      link: '/dashboard',
    });
  }

  res.status(201).json({
    success: true,
    message: 'Guidance appointment scheduled successfully',
    data: appointment,
  });
});

// PUT /api/teacher/appointments/:id
// Update appointment status, add guidance notes or action items
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await GuidanceAppointment.findById(id);
  if (!appointment) throw new ApiError(404, 'Appointment record not found');

  if (req.user.role !== 'admin' && String(appointment.guide) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to modify this appointment');
  }

  const { status, guideFeedback, actionItems, scheduledDate, scheduledTime, location } = req.body;
  if (status) appointment.status = status;
  if (guideFeedback !== undefined) appointment.guideFeedback = guideFeedback.trim();
  if (actionItems !== undefined) {
    appointment.actionItems = Array.isArray(actionItems)
      ? actionItems
      : String(actionItems).split('\n').map((s) => s.trim()).filter(Boolean);
  }
  if (scheduledDate) appointment.scheduledDate = new Date(scheduledDate);
  if (scheduledTime) appointment.scheduledTime = scheduledTime.trim();
  if (location) appointment.location = location.trim();

  if (status === 'completed') {
    appointment.completedAt = new Date();
  }

  await appointment.save();

  if (appointment.student) {
    await notify(appointment.student, {
      type: 'appointment_updated',
      title: 'Guidance Appointment Updated',
      body: `Your session on "${appointment.topic}" has been updated to status: ${appointment.status}.`,
      link: '/dashboard',
    });
  }

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    data: appointment,
  });
});

// GET /api/teacher/placement-overview
// Placement and career guidance: resume reviews, interview prep, and alumni mentor links
exports.getPlacementOverview = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const apptFilter = req.user.role === 'admin' ? {} : { guide: teacherId };

  const [resumeReviews, interviewPreps, careerGuidances, alumniMentors] = await Promise.all([
    GuidanceAppointment.countDocuments({ ...apptFilter, type: 'resume_review' }),
    GuidanceAppointment.countDocuments({ ...apptFilter, type: 'interview_prep' }),
    GuidanceAppointment.countDocuments({ ...apptFilter, type: 'career_guidance' }),
    AlumniProfile.find({
      verificationStatus: 'verified',
      availableForMentorship: true,
    })
      .select('fullName currentCompany currentJobTitle graduationYear skills preferredMentorshipTopics')
      .limit(6)
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      metrics: {
        resumeReviews,
        interviewPreps,
        careerGuidances,
        totalCareerSessions: resumeReviews + interviewPreps + careerGuidances,
      },
      placementReadinessChecklist: [
        { item: 'Technical Resume Formatting & Keyword Optimization', status: 'Active' },
        { item: 'Core CS Fundamentals & System Design Review', status: 'Active' },
        { item: 'Mock Technical Coding & DSA Evaluation', status: 'Active' },
        { item: 'Alumni Referrals & Industry Outreach Connection', status: 'Recommended' },
      ],
      suggestedAlumniMentors: alumniMentors,
    },
  });
});

// GET /api/teacher/groups
exports.getGroups = asyncHandler(async (req, res) => {
  const { search, status, department } = req.query;
  const query = req.user.role === 'admin' ? {} : { assignedTeacher: req.user._id };

  if (department) {
    query.department = department;
  }

  if (status === 'at-risk') {
    query.isAtRisk = true;
  } else if (status === 'on-track') {
    query.isAtRisk = false;
  }

  let groups = await ProjectGroup.find(query).sort({ updatedAt: -1 });

  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    groups = groups.filter((g) => {
      const matchTitle = g.title.toLowerCase().includes(s);
      const matchMember = (g.members || []).some(
        (m) => (m.name && m.name.toLowerCase().includes(s)) || (m.rollNumber && m.rollNumber.toLowerCase().includes(s))
      );
      return matchTitle || matchMember;
    });
  }

  res.json({ success: true, count: groups.length, data: groups });
});

// GET /api/teacher/groups/:id
exports.getGroupById = asyncHandler(async (req, res) => {
  const group = await ProjectGroup.findById(req.params.id);
  if (!group) throw new ApiError(404, 'Project group not found');

  if (req.user.role !== 'admin' && String(group.assignedTeacher) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to view this project group');
  }

  res.json({ success: true, data: group });
});

// POST /api/teacher/groups
exports.createGroup = asyncHandler(async (req, res) => {
  const { title, description, department, academicYear, members, milestones, githubRepo, tags } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, 'Project title is required');

  const group = new ProjectGroup({
    title: title.trim(),
    description: description ? description.trim() : '',
    department: department || 'Computer Engineering',
    academicYear: academicYear || '2025-2026',
    assignedTeacher: req.user._id,
    members: Array.isArray(members) ? members : [],
    milestones: Array.isArray(milestones) ? milestones : [],
    githubRepo: githubRepo ? githubRepo.trim() : '',
    tags: Array.isArray(tags) ? tags : [],
  });

  group.recalculateProgress();
  await group.save();

  res.status(201).json({ success: true, message: 'Project group created successfully', data: group });
});

// PUT /api/teacher/milestones/:groupId/:milestoneId/review
exports.reviewMilestone = asyncHandler(async (req, res) => {
  const { groupId, milestoneId } = req.params;
  const { status, feedback } = req.body;

  if (!['approved', 'revisions_requested', 'pending', 'submitted'].includes(status)) {
    throw new ApiError(400, "Invalid status. Allowed values: 'approved', 'revisions_requested', 'pending', 'submitted'");
  }

  const group = await ProjectGroup.findById(groupId);
  if (!group) throw new ApiError(404, 'Project group not found');

  if (req.user.role !== 'admin' && String(group.assignedTeacher) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to review milestones for this project group');
  }

  let milestone = group.milestones.id(milestoneId);
  if (!milestone && !isNaN(Number(milestoneId))) {
    milestone = group.milestones[Number(milestoneId)];
  }

  if (!milestone) throw new ApiError(404, 'Milestone not found');

  milestone.status = status;
  if (feedback !== undefined) milestone.feedback = feedback.trim();
  milestone.reviewedAt = new Date();
  milestone.reviewedBy = req.user._id;

  group.recalculateProgress();
  await group.save();

  res.json({
    success: true,
    message: `Milestone status updated to ${status}`,
    data: group,
  });
});

// PUT /api/teacher/groups/:id/flag
exports.toggleAtRisk = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isAtRisk, atRiskReason } = req.body;

  const group = await ProjectGroup.findById(id);
  if (!group) throw new ApiError(404, 'Project group not found');

  if (req.user.role !== 'admin' && String(group.assignedTeacher) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to modify this project group');
  }

  group.isAtRisk = Boolean(isAtRisk);
  group.atRiskReason = group.isAtRisk ? (atRiskReason ? atRiskReason.trim() : 'Flagged as requiring attention') : '';

  await group.save();

  res.json({
    success: true,
    message: group.isAtRisk ? 'Project group flagged as at risk' : 'At-risk flag cleared',
    data: group,
  });
});

// POST /api/teacher/groups/:id/milestones
exports.addMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate } = req.body;

  if (!title || !title.trim()) throw new ApiError(400, 'Milestone title is required');

  const group = await ProjectGroup.findById(id);
  if (!group) throw new ApiError(404, 'Project group not found');

  if (req.user.role !== 'admin' && String(group.assignedTeacher) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to modify this project group');
  }

  group.milestones.push({
    title: title.trim(),
    description: description ? description.trim() : '',
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status: 'pending',
  });

  group.recalculateProgress();
  await group.save();

  res.status(201).json({
    success: true,
    message: 'Milestone added successfully',
    data: group,
  });
});

// DELETE /api/teacher/groups/:id
exports.deleteGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const group = await ProjectGroup.findById(id);
  if (!group) throw new ApiError(404, 'Project group not found');

  if (req.user.role !== 'admin' && String(group.assignedTeacher) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to delete this project group');
  }

  await ProjectGroup.findByIdAndDelete(id);
  res.json({ success: true, message: 'Project group deleted successfully' });
});
