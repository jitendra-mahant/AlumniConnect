/**
 * Safe Deletion Script for Jitendra Mahant Account
 * Targets ONLY the account with email: jkmahant370124@kkwagh.edu.in
 * Cascades cleanup of orphaned user notifications/profiles.
 * Requires explicit execution.
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Notification = require('../models/Notification');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');

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
        success: false,
        message: `Account with email ${TARGET_EMAIL} was not found in the database.`,
      }, null, 2));
      process.exit(0);
    }

    const userId = user._id;

    // Remove dependent records
    const [notifResult, alumniResult, studentResult, teacherResult] = await Promise.all([
      Notification.deleteMany({ user: userId }),
      AlumniProfile.deleteMany({ user: userId }),
      StudentProfile.deleteMany({ user: userId }),
      TeacherProfile.deleteMany({ user: userId }),
    ]);

    // Remove user record
    const userResult = await User.deleteOne({ _id: userId });

    // Verify post-deletion
    const checkUser = await User.findOne({ email: TARGET_EMAIL });
    const totalRemainingUsers = await User.countDocuments();

    console.log(JSON.stringify({
      success: true,
      deletedUser: {
        id: userId.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      cleanup: {
        notificationsDeleted: notifResult.deletedCount,
        alumniProfilesDeleted: alumniResult.deletedCount,
        studentProfilesDeleted: studentResult.deletedCount,
        teacherProfilesDeleted: teacherResult.deletedCount,
        userDeleted: userResult.deletedCount,
      },
      verifiedGone: checkUser === null,
      remainingTotalUsers: totalRemainingUsers,
      message: `Account ${TARGET_EMAIL} and its dependent records have been successfully deleted.`,
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('DELETION_ERROR:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
