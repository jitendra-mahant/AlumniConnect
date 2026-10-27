/**
 * importCsvService.js
 *
 * Safe, idempotent CSV alumni data import and deduplication service for Alumni Connect.
 * Imports records from:
 *   - alumni_2015_2016.csv (Batch 2015-2016, Graduation 2016)
 *   - alumni_2016_2017.csv (Batch 2016-2017, Graduation 2017)
 *   - alumni_2017_2018.csv (Batch 2017-2018, Graduation 2018)
 *
 * Adheres strictly to security and data protection requirements:
 * 1. NEVER creates login accounts with arbitrary passwords. Imported alumni are discoverable profiles only.
 * 2. Idempotent: safe to run multiple times without creating duplicates.
 * 3. Stable unique identifier: verified email primary, valid LinkedIn secondary, name+year tertiary.
 * 4. Preserves user-managed fields on conflict.
 * 5. Synchronizes both Mongoose `AlumniProfile` and raw `db_alumini_years.alumini` collection.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const AlumniProfile = require('../models/AlumniProfile');
const User = require('../models/User');
const { normalizeCompanyName } = require('./import2022Service');
const { invalidate } = require('../dsa/indexService');

const COLLEGE = 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)';
const DEPARTMENT = 'Computer Engineering';
const DEGREE = 'B.E.';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Derives skills and technologies from role and company.
 */
function inferSkills(role, company) {
  const text = `${role || ''} ${company || ''}`.toLowerCase();
  const list = [];
  if (text.includes('salesforce')) list.push('Salesforce', 'Apex', 'Cloud');
  if (text.includes('data') || text.includes('analyst') || text.includes('bi') || text.includes('etl')) list.push('Data Analysis', 'SQL', 'Python');
  if (text.includes('ai') || text.includes('ml')) list.push('Machine Learning', 'Python', 'AI');
  if (text.includes('flutter') || text.includes('mobile')) list.push('Flutter', 'Dart', 'Mobile Dev');
  if (text.includes('ios') || text.includes('swift')) list.push('iOS', 'Swift', 'Xcode');
  if (text.includes('angular') || text.includes('react') || text.includes('frontend') || text.includes('web')) list.push('JavaScript', 'TypeScript', 'Web Development');
  if (text.includes('java') || text.includes('backend') || text.includes('.net')) list.push('Java', 'Backend Systems', 'Spring Boot');
  if (text.includes('devops') || text.includes('cloud') || text.includes('sre')) list.push('DevOps', 'AWS', 'Docker', 'Kubernetes');
  if (text.includes('qa') || text.includes('test') || text.includes('quality')) list.push('QA Automation', 'Testing', 'Selenium');
  if (text.includes('product')) list.push('Product Roadmap', 'Agile', 'Sprint Planning');
  if (text.includes('lead') || text.includes('manager') || text.includes('director') || text.includes('vp')) list.push('Technical Leadership', 'System Design', 'Agile');
  if (text.includes('marketing') || text.includes('sales') || text.includes('recruiter')) list.push('Business Development', 'Strategic Communications');
  if (list.length === 0) list.push('Software Engineering', 'Problem Solving', 'Data Structures');
  return [...new Set(list)];
}

/**
 * RFC 4180 compliant CSV line parser.
 * Handles embedded commas in quotes and escaped quotes ("").
 */
function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

/**
 * Safe CSV file reader.
 */
function readCSVFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1); // remove BOM
  }
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = (values[i] || '').trim();
    });
    return obj;
  });
  return { header, rows };
}

/**
 * Derives professional domain from job title.
 */
function domainFromDesignation(designation) {
  if (!designation) return 'Technology';
  const d = designation.toLowerCase();
  if (d.includes('data') || d.includes('analyst') || d.includes('bi')) return 'Data & Analytics';
  if (d.includes('devops') || d.includes('cloud') || d.includes('infra') || d.includes('sre')) return 'DevOps / Cloud';
  if (d.includes('product') || d.includes('project')) return 'Product Management';
  if (d.includes('qa') || d.includes('quality') || d.includes('test')) return 'Quality Assurance';
  if (d.includes('manager') || d.includes('director') || d.includes('vp') || d.includes('lead')) return 'Management';
  if (d.includes('business') || d.includes('sales') || d.includes('marketing')) return 'Business';
  if (d.includes('recruiter') || d.includes('hr') || d.includes('talent')) return 'Human Resources';
  if (d.includes('founder') || d.includes('ceo') || d.includes('co-founder')) return 'Entrepreneurship';
  if (d.includes('research') || d.includes('scientist') || d.includes('phd')) return 'Research & Academia';
  if (d.includes('consultant') || d.includes('advisory')) return 'Consulting';
  if (d.includes('student')) return 'Higher Education';
  return 'Software Engineering';
}

/**
 * Validates whether string is a real web URL.
 */
function isValidUrl(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

/**
 * Finds target CSV files across candidate search paths.
 */
function resolveCSVPaths() {
  const targetFilenames = [
    'alumni_2015_2016.csv',
    'alumni_2016_2017.csv',
    'alumni_2017_2018.csv',
  ];

  const candidateDirs = [
    path.resolve(__dirname, '../../../fer'),
    path.resolve(__dirname, '../../fer'),
    path.resolve(__dirname, '../../data'),
    path.resolve(__dirname, '../data'),
    path.resolve(__dirname, '../../'),
    path.resolve(process.cwd(), 'fer'),
    path.resolve(process.cwd()),
  ];

  const resolved = [];

  for (const filename of targetFilenames) {
    let foundPath = null;
    for (const dir of candidateDirs) {
      const candidate = path.join(dir, filename);
      if (fs.existsSync(candidate)) {
        foundPath = candidate;
        break;
      }
    }
    if (foundPath) {
      resolved.push(foundPath);
    } else {
      console.warn(`[importCsv] Warning: CSV file not found: ${filename}`);
    }
  }

  return resolved;
}

/**
 * Escapes string for RegExp construction.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main CSV Import function.
 * @param {Object} options - { silent: boolean }
 * @returns {Promise<Object>} Import summary report
 */
async function importCsvAlumni(options = {}) {
  const silent = options.silent === true;
  const filePaths = resolveCSVPaths();

  const report = {
    totalFiles: filePaths.length,
    filesProcessed: [],
    totalRecordsRead: 0,
    inserted: 0,
    updated: 0,
    duplicates: 0,
    rejected: 0,
    qualityMetrics: {
      missingEmail: 0,
      missingCompany: 0,
      missingDesignation: 0,
      missingLocation: 0,
      validLinkedIn: 0,
      nonUrlLinkedInHandled: 0,
    },
    batches: {},
    timestamp: new Date().toISOString(),
  };

  if (filePaths.length === 0) {
    if (!silent) console.warn('[importCsv] No CSV files found to process.');
    return report;
  }

  // Raw alumini collection in the database
  const aluminiCollection = mongoose.connection.db ? mongoose.connection.db.collection('alumini') : null;

  // Process each CSV file
  for (const filePath of filePaths) {
    const filename = path.basename(filePath);
    const { rows } = readCSVFile(filePath);
    report.filesProcessed.push(filename);
    report.totalRecordsRead += rows.length;

    let batchInserted = 0;
    let batchUpdated = 0;
    let batchDuplicates = 0;
    let batchRejected = 0;

    for (const row of rows) {
      const rawName = (row.fullName || row.name || '').trim();
      if (!rawName) {
        report.rejected += 1;
        batchRejected += 1;
        continue;
      }

      // 1. Clean and validate email
      let email = (row.email || '').trim().toLowerCase();
      let hasValidEmail = false;
      if (email) {
        if (EMAIL_REGEX.test(email)) {
          hasValidEmail = true;
        } else {
          // Invalid format
          email = undefined;
          report.qualityMetrics.missingEmail += 1;
        }
      } else {
        email = undefined;
        report.qualityMetrics.missingEmail += 1;
      }

      // 2. Company & role normalization
      const rawCompany = (row.company || '').trim();
      const currentCompany = rawCompany || 'Company Not Specified';
      if (!rawCompany) report.qualityMetrics.missingCompany += 1;
      const companyNormalized = normalizeCompanyName(currentCompany);

      const rawDesignation = (row.designation || row.role || '').trim();
      const currentJobTitle = rawDesignation || 'Role Not Specified';
      if (!rawDesignation) report.qualityMetrics.missingDesignation += 1;

      // 3. Location
      const location = (row.location || '').trim();
      if (!location) report.qualityMetrics.missingLocation += 1;

      // 4. Batch & Graduation Year
      const rawBatch = (row.batch || '').trim();
      const rawGradYear = parseInt(row.graduationYear || row.graduation_year, 10);
      let graduationYear = !Number.isNaN(rawGradYear) ? rawGradYear : null;
      if (!graduationYear && rawBatch) {
        const parts = rawBatch.split('-');
        graduationYear = parseInt(parts[parts.length - 1], 10) || null;
      }
      const batch = rawBatch || (graduationYear ? String(graduationYear) : 'N/A');

      // 5. LinkedIn profile URL handling
      const rawLinkedIn = (row.linkedinProfile || row.linkedin || '').trim();
      let linkedinUrl = undefined;
      let linkedinConfirmed = false;
      let linkedinVisibility = 'private';

      if (rawLinkedIn) {
        if (isValidUrl(rawLinkedIn)) {
          linkedinUrl = rawLinkedIn;
          linkedinConfirmed = true;
          linkedinVisibility = 'all_authenticated';
          report.qualityMetrics.validLinkedIn += 1;
        } else {
          // It's a text anchor like "Divyani A. | LinkedIn" - safely omit as URL
          report.qualityMetrics.nonUrlLinkedInHandled += 1;
        }
      }

      // 6. Domain, skills, and experience
      const professionalDomain = domainFromDesignation(currentJobTitle);
      const skills = inferSkills(currentJobTitle, currentCompany);
      const technologies = skills.slice(0, 3);
      const currentYear = new Date().getFullYear();
      const experienceYears = graduationYear ? Math.max(0, currentYear - graduationYear) : 0;

      // 7. Find existing profile using stable identifier:
      //    Primary: email match
      //    Secondary: valid linkedinUrl match
      //    Tertiary: fullName + graduationYear match
      let profile = null;
      if (email) {
        profile = await AlumniProfile.findOne({ email });
      }
      if (!profile && linkedinUrl) {
        profile = await AlumniProfile.findOne({ linkedinUrl });
      }
      if (!profile && graduationYear) {
        profile = await AlumniProfile.findOne({
          fullName: new RegExp(`^${escapeRegex(rawName)}$`, 'i'),
          graduationYear,
        });
      }

      // 8. Find if a registered User account already exists with this email (DO NOT CREATE NEW USER!)
      let existingUser = null;
      if (email) {
        existingUser = await User.findOne({ email });
      }

      try {
        if (!profile) {
          // INSERT new AlumniProfile
          profile = new AlumniProfile({
            user: existingUser ? existingUser._id : undefined, // strictly undefined if not registered
            fullName: rawName,
            email,
            currentCompany,
            companyNormalized,
            currentJobTitle,
            location: location || undefined,
            workLocation: location || undefined,
            batch,
            graduationYear: graduationYear || 2022,
            college: COLLEGE,
            department: DEPARTMENT,
            degree: DEGREE,
            professionalDomain,
            industry: 'Information Technology',
            skills,
            technologies,
            experienceYears,
            linkedinUrl,
            linkedinConfirmed,
            linkedinVisibility,
            verificationStatus: 'verified',
            verifiedAt: new Date(),
            importSource: `csv_import_${batch.replace(/[^0-9]/g, '_')}`,
            importBatch: batch,
          });

          await profile.save();
          report.inserted += 1;
          batchInserted += 1;
        } else {
          // MERGE POLICY: Update missing fields without overwriting user-managed customized data
          let changed = false;

          // Link to existing user if not previously linked
          if (!profile.user && existingUser) {
            profile.user = existingUser._id;
            changed = true;
          }

          // If current company was unspecified, update with CSV data
          if (
            (!profile.currentCompany || profile.currentCompany === 'Company Not Specified') &&
            currentCompany !== 'Company Not Specified'
          ) {
            profile.currentCompany = currentCompany;
            profile.companyNormalized = companyNormalized;
            changed = true;
          }

          // If current job title was unspecified, update with CSV data
          if (
            (!profile.currentJobTitle || profile.currentJobTitle === 'Role Not Specified') &&
            currentJobTitle !== 'Role Not Specified'
          ) {
            profile.currentJobTitle = currentJobTitle;
            changed = true;
          }

          // If location was empty, fill it
          if (!profile.location && location) {
            profile.location = location;
            profile.workLocation = location;
            changed = true;
          }

          // If linkedinUrl was missing and CSV has valid URL, add it
          if (!profile.linkedinUrl && linkedinUrl) {
            profile.linkedinUrl = linkedinUrl;
            profile.linkedinConfirmed = true;
            profile.linkedinVisibility = 'all_authenticated';
            changed = true;
          }

          // Ensure batch is set
          if (!profile.batch || profile.batch === '2022' || profile.batch === 'N/A') {
            profile.batch = batch;
            profile.importBatch = batch;
            changed = true;
          }

          // Ensure graduationYear is set
          if (!profile.graduationYear && graduationYear) {
            profile.graduationYear = graduationYear;
            changed = true;
          }

          if (changed) {
            await profile.save();
            report.updated += 1;
            batchUpdated += 1;
          } else {
            report.duplicates += 1;
            batchDuplicates += 1;
          }
        }

        // 9. Synchronize raw alumini collection in db_alumini_years
        if (aluminiCollection) {
          const rawMatch = email
            ? { email }
            : { name: rawName, graduationYear: graduationYear || 2022 };

          const aluminiDoc = {
            name: rawName,
            email: email || undefined,
            company: currentCompany,
            role: currentJobTitle,
            location: location || undefined,
            batch,
            graduationYear: graduationYear || 2022,
            department: DEPARTMENT,
            linkedin: linkedinUrl || undefined,
          };

          await aluminiCollection.updateOne(
            rawMatch,
            { $set: aluminiDoc },
            { upsert: true }
          );
        }
      } catch (err) {
        console.error(`[importCsv] Error processing record "${rawName}":`, err.message);
        report.rejected += 1;
        batchRejected += 1;
      }
    }

    report.batches[filename] = {
      read: rows.length,
      inserted: batchInserted,
      updated: batchUpdated,
      duplicates: batchDuplicates,
      rejected: batchRejected,
    };

    if (!silent) {
      console.log(`[importCsv] ${filename}: ${rows.length} read, ${batchInserted} inserted, ${batchUpdated} updated, ${batchDuplicates} existing/unchanged, ${batchRejected} rejected.`);
    }
  }

  // Also seed raw db_alumini_years.alumini with 2022 JSON if empty
  if (aluminiCollection) {
    try {
      const existingRawCount = await aluminiCollection.countDocuments({ graduationYear: 2022 });
      if (existingRawCount === 0) {
        const jsonPath = path.resolve(__dirname, '../../db_alumini_years.alumini.json');
        if (fs.existsSync(jsonPath)) {
          const rawJsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          if (Array.isArray(rawJsonData) && rawJsonData.length > 0) {
            for (const item of rawJsonData) {
              const cleanItem = {
                name: item.name,
                email: item.email || undefined,
                secondary_email: item.secondary_email || undefined,
                company: item.company || 'Company Not Specified',
                role: item.role || 'Role Not Specified',
                linkedin: item.linkedin || undefined,
                graduationYear: item.graduationYear || 2022,
                department: item.department || DEPARTMENT,
              };
              if (item.email) {
                await aluminiCollection.updateOne({ email: item.email }, { $set: cleanItem }, { upsert: true });
              } else {
                await aluminiCollection.updateOne({ name: item.name, graduationYear: 2022 }, { $set: cleanItem }, { upsert: true });
              }
            }
            if (!silent) console.log(`[importCsv] Synchronized ${rawJsonData.length} records into db_alumini_years.alumini.`);
          }
        }
      }
    } catch (e) {
      console.warn('[importCsv] Notice while syncing raw 2022 JSON into alumini collection:', e.message);
    }
  }

  // Refresh in-memory trie and skill indexes
  invalidate();

  return report;
}

module.exports = {
  importCsvAlumni,
  resolveCSVPaths,
  domainFromDesignation,
  isValidUrl,
};
