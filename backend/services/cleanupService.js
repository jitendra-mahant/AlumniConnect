const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const AdminAuditLog = require('../models/AdminAuditLog');
const { RAW_2022_RECORDS } = require('./import2022Service');

/**
 * Normalizes email or name for deterministic comparison.
 */
const norm = (s) => String(s || '').trim().toLowerCase();

/**
 * Builds a dry-run comparison between database records and the latest supplied dataset.
 * Does NOT perform any deletions.
 */
async function generateDryRunReport() {
  const datasetEmails = new Set(RAW_2022_RECORDS.map((r) => norm(r.email)).filter(Boolean));
  const datasetSecondaryEmails = new Set(RAW_2022_RECORDS.map((r) => norm(r.secondary_email)).filter(Boolean));
  const datasetNames = new Set(RAW_2022_RECORDS.map((r) => norm(r.name)).filter(Boolean));

  // Fetch all alumni profiles currently in DB
  const existingProfiles = await AlumniProfile.find({}).populate('user', 'name email role').lean();

  const retained = [];
  const obsoleteSamples = [];

  for (const p of existingProfiles) {
    const pEmail = norm(p.email || p.user?.email);
    const pName = norm(p.fullName || p.user?.name);
    const isMockDomain = pEmail.endsWith('@alumniconnect.edu');

    const inDataset =
      datasetEmails.has(pEmail) ||
      datasetSecondaryEmails.has(pEmail) ||
      datasetNames.has(pName);

    if (inDataset) {
      retained.push({
        id: p._id,
        name: p.fullName,
        email: p.email || p.user?.email,
        company: p.currentCompany,
        graduationYear: p.graduationYear,
        status: 'Retained (Verified against latest dataset)',
      });
    } else if (isMockDomain) {
      obsoleteSamples.push({
        id: p._id,
        userId: p.user?._id,
        name: p.fullName,
        email: p.email || p.user?.email,
        company: p.currentCompany,
        graduationYear: p.graduationYear,
        reason: 'Legacy seed sample record (@alumniconnect.edu) not present in latest dataset',
      });
    } else {
      // Non-mock record that might be user-registered; retain safely
      retained.push({
        id: p._id,
        name: p.fullName,
        email: p.email || p.user?.email,
        company: p.currentCompany,
        graduationYear: p.graduationYear,
        status: 'Retained (Registered profile)',
      });
    }
  }

  // Count protected application accounts
  const [adminCount, studentCount, teacherCount] = await Promise.all([
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
  ]);

  return {
    sourceDatasetCount: RAW_2022_RECORDS.length,
    databaseAlumniCount: existingProfiles.length,
    retainedCount: retained.length,
    obsoleteSampleCount: obsoleteSamples.length,
    retainedProfiles: retained,
    obsoleteSampleProfiles: obsoleteSamples,
    protectedAccountsSummary: {
      administrators: adminCount,
      facultyGuides: teacherCount,
      students: studentCount,
      message: 'All administrative, faculty, and student accounts are fully preserved.',
    },
    timestamp: new Date(),
  };
}

/**
 * Safely backs up and deletes confirmed obsolete sample alumni records.
 * NEVER deletes student, teacher, admin accounts, or dataset alumni.
 */
async function executeAlumniCleanup(adminUser) {
  const dryRun = await generateDryRunReport();
  const toDelete = dryRun.obsoleteSampleProfiles;

  if (toDelete.length === 0) {
    return {
      success: true,
      deletedCount: 0,
      message: 'No obsolete sample alumni records found. Database is already synchronized with latest dataset.',
      dryRun,
    };
  }

  // 1. Create a safe disk backup before any destructive operation
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `alumni_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(toDelete, null, 2), 'utf-8');

  // 2. Safely remove only confirmed obsolete sample profiles and their mock user accounts
  const profileIds = toDelete.map((p) => p.id);
  const userIds = toDelete.map((p) => p.userId).filter(Boolean);

  const profileResult = await AlumniProfile.deleteMany({ _id: { $in: profileIds } });
  let userResult = { deletedCount: 0 };
  if (userIds.length > 0) {
    userResult = await User.deleteMany({
      _id: { $in: userIds },
      role: 'alumni',
      email: { $regex: /@alumniconnect\.edu$/i },
    });
  }

  // 3. Record administrative audit log
  await AdminAuditLog.create({
    admin: adminUser?._id || new mongoose.Types.ObjectId(),
    adminEmail: adminUser?.email || 'admin@kkwagh.edu.in',
    action: 'alumni_dataset_cleanup',
    targetType: 'alumni_record',
    details: `Removed ${profileResult.deletedCount} obsolete sample alumni records. Backup saved to ${path.basename(backupFile)}.`,
  });

  return {
    success: true,
    backupFile: path.basename(backupFile),
    deletedAlumniProfiles: profileResult.deletedCount,
    deletedMockUsers: userResult.deletedCount,
    retainedCount: dryRun.retainedCount,
    message: `Cleaned up ${profileResult.deletedCount} obsolete mock records. Backup saved.`,
  };
}

module.exports = {
  generateDryRunReport,
  executeAlumniCleanup,
};
