/**
 * Safe Inspection Script for Jitendra Mahant Account
 * Checks for the existence of jkmahant370124@kkwagh.edu.in and counts all related records.
 * READ-ONLY: Performs NO deletions or modifications.
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Connection = require('../models/Connection');
const MentorshipRequest = require('../models/MentorshipRequest');
const ReferralRequest = require('../models/ReferralRequest');
const Job = require('../models/Job');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Report = require('../models/Report');

const TARGET_EMAIL = 'jkmahant370124@kkwagh.edu.in'.trim().toLowerCase();

(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DATABASE_CONNECTION_ERROR:', err.message);
    process.exit(2);
  }

  try {
    const user = await User.findOne({ email: TARGET_EMAIL });

    if (!user) {
      console.log(JSON.stringify({
        found: false,
        emailSearched: TARGET_EMAIL,
        message: 'No user account found with email ' + TARGET_EMAIL,
      }, null, 2));
      process.exit(0);
    }

    const userId = user._id;

    // Count related records across all collections
    const [
      alumniProfilesCount,
      studentProfilesCount,
      teacherProfilesCount,
      notificationsCount,
      messagesSentCount,
      messagesReceivedCount,
      connectionsCount,
      mentorshipAsStudentCount,
      mentorshipAsAlumniCount,
      referralsAsStudentCount,
      referralsAsAlumniCount,
      jobsPostedCount,
      questionsCount,
      answersCount,
      reportsCreatedCount,
    ] = await Promise.all([
      AlumniProfile.countDocuments({ user: userId }),
      StudentProfile.countDocuments({ user: userId }),
      TeacherProfile.countDocuments({ user: userId }),
      Notification.countDocuments({ user: userId }),
      Message.countDocuments({ sender: userId }),
      Message.countDocuments({ recipient: userId }),
      Connection.countDocuments({ $or: [{ requester: userId }, { recipient: userId }] }),
      MentorshipRequest.countDocuments({ student: userId }),
      MentorshipRequest.countDocuments({ alumni: userId }),
      ReferralRequest.countDocuments({ student: userId }),
      ReferralRequest.countDocuments({ alumni: userId }),
      Job.countDocuments({ postedBy: userId }),
      Question.countDocuments({ author: userId }),
      Answer.countDocuments({ author: userId }),
      Report.countDocuments({ reporter: userId }),
    ]);

    const report = {
      found: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        institution: user.institution,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      relatedRecords: {
        alumniProfile: alumniProfilesCount,
        studentProfile: studentProfilesCount,
        teacherProfile: teacherProfilesCount,
        notifications: notificationsCount,
        messages: {
          sent: messagesSentCount,
          received: messagesReceivedCount,
          total: messagesSentCount + messagesReceivedCount,
        },
        connections: connectionsCount,
        mentorshipRequests: {
          asStudent: mentorshipAsStudentCount,
          asAlumni: mentorshipAsAlumniCount,
          total: mentorshipAsStudentCount + mentorshipAsAlumniCount,
        },
        referralRequests: {
          asStudent: referralsAsStudentCount,
          asAlumni: referralsAsAlumniCount,
          total: referralsAsStudentCount + referralsAsAlumniCount,
        },
        jobsPosted: jobsPostedCount,
        questionsAsked: questionsCount,
        answersGiven: answersCount,
        reportsFiled: reportsCreatedCount,
      },
      totalRelatedRecords:
        alumniProfilesCount +
        studentProfilesCount +
        teacherProfilesCount +
        notificationsCount +
        messagesSentCount +
        messagesReceivedCount +
        connectionsCount +
        mentorshipAsStudentCount +
        mentorshipAsAlumniCount +
        referralsAsStudentCount +
        referralsAsAlumniCount +
        jobsPostedCount +
        questionsCount +
        answersCount +
        reportsCreatedCount,
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('INSPECTION_ERROR:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
