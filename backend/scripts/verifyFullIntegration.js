/**
 * verifyFullIntegration.js
 *
 * Comprehensive non-destructive test suite verifying:
 * 1. MongoDB connectivity to db_alumini_years
 * 2. Complete integration of 2015-2016, 2016-2017, and 2017-2018 batches
 * 3. Search and filter accuracy
 * 4. Privacy compliance (no arbitrary logins, phone omitted, LinkedIn URL safety)
 * 5. Company directory and admin reporting
 * 6. User registration linking to pre-imported profile
 * 7. Idempotency of import
 */

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('../config/env');
const env = require('../config/env');
const connectDB = require('../config/db');
const { createApp } = require('../server');
const AlumniProfile = require('../models/AlumniProfile');
const User = require('../models/User');
const { importCsvAlumni } = require('../services/importCsvService');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('    Alumni Connect — Full Integration & Verification Test Suite    ');
  console.log('='.repeat(70));

  await connectDB();
  const db = mongoose.connection.db;
  console.log(`[db] Connected to: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}\n`);

  // Start internal test server
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const admin = await User.findOne({ role: 'admin' });
  const authHeaders = {
    Authorization: `Bearer ${jwt.sign({ id: admin._id, role: admin.role }, env.jwtSecret, { expiresIn: '1d' })}`,
    'Content-Type': 'application/json',
  };

  // Section 1: Database Safety & Collections
  console.log('--- Section 1: Database & Model Schema Verification ---');
  assert(mongoose.connection.name === 'db_alumini_years', 'Connected database is named db_alumini_years', `Expected db_alumini_years, got ${mongoose.connection.name}`);
  const totalProfiles = await AlumniProfile.countDocuments();
  assert(totalProfiles >= 120, 'AlumniProfile collection contains all batches', `Found ${totalProfiles}`);
  const rawAluminiCount = await db.collection('alumini').countDocuments();
  assert(rawAluminiCount >= 110, 'Raw db_alumini_years.alumini collection populated and synchronized', `Found ${rawAluminiCount}`);

  // Section 2: Batch Verification
  console.log('\n--- Section 2: CSV Batch Integration Verification ---');
  const batch2016 = await AlumniProfile.countDocuments({ $or: [{ graduationYear: 2016 }, { batch: '2015-2016' }] });
  assert(batch2016 >= 9, '2015-2016 batch present (Graduation Year 2016)', `Found ${batch2016}`);

  const batch2017 = await AlumniProfile.countDocuments({ $or: [{ graduationYear: 2017 }, { batch: '2016-2017' }] });
  assert(batch2017 >= 41, '2016-2017 batch present (Graduation Year 2017)', `Found ${batch2017}`);

  const batch2018 = await AlumniProfile.countDocuments({ $or: [{ graduationYear: 2018 }, { batch: '2017-2018' }] });
  assert(batch2018 >= 14, '2017-2018 batch present (Graduation Year 2018)', `Found ${batch2018}`);

  const batch2022 = await AlumniProfile.countDocuments({ $or: [{ graduationYear: 2022 }, { batch: '2022' }] });
  assert(batch2022 >= 48, '2022 batch present (Graduation Year 2022)', `Found ${batch2022}`);

  // Section 3: Privacy & Security Guardrails
  console.log('\n--- Section 3: Privacy & Security Guardrails ---');
  // Check that imported CSV records have no User account with arbitrary password
  const importedWithoutUser = await AlumniProfile.countDocuments({
    $or: [{ user: null }, { user: { $exists: false } }],
    importSource: /^csv_import_/,
  });
  assert(importedWithoutUser === 64, 'Imported alumni do NOT have arbitrary login accounts created', `Expected 64, got ${importedWithoutUser}`);

  // Check phone numbers are NOT stored in AlumniProfile
  const sampleCsvAlumni = await AlumniProfile.findOne({ email: 'aayushi94g@gmail.com' });
  assert(sampleCsvAlumni && sampleCsvAlumni.phone === undefined, 'No phone number stored in AlumniProfile');

  // Check 2017-2018 text anchors are not stored as invalid URLs
  const sampleTextLinkedIn = await AlumniProfile.findOne({ email: 'divyanianerao97@gmail.com' });
  assert(sampleTextLinkedIn && !sampleTextLinkedIn.linkedinUrl, 'Non-URL LinkedIn text safely omitted as linkedinUrl', `Found ${sampleTextLinkedIn?.linkedinUrl}`);

  // Check valid LinkedIn URLs are properly stored
  assert(sampleCsvAlumni && sampleCsvAlumni.linkedinUrl?.startsWith('https://'), 'Valid LinkedIn URL properly formatted and stored');

  // Section 4: API Directory Search & Filtering
  console.log('\n--- Section 4: API Directory Search & Filters ---');
  let res = await fetch(`${baseUrl}/api/alumni/search?graduationYear=2016`, { headers: authHeaders });
  let data = await res.json();
  assert(res.status === 200 && data.total >= 9, 'Search by graduationYear=2016 returns correct records', `Total: ${data.total}`);

  res = await fetch(`${baseUrl}/api/alumni/search?graduationYear=2017`, { headers: authHeaders });
  data = await res.json();
  assert(res.status === 200 && data.total >= 41, 'Search by graduationYear=2017 returns correct records', `Total: ${data.total}`);

  res = await fetch(`${baseUrl}/api/alumni/search?graduationYear=2018`, { headers: authHeaders });
  data = await res.json();
  assert(res.status === 200 && data.total >= 14, 'Search by graduationYear=2018 returns correct records', `Total: ${data.total}`);

  res = await fetch(`${baseUrl}/api/alumni/search?q=Finastra`, { headers: authHeaders });
  data = await res.json();
  assert(res.status === 200 && data.total >= 1 && data.data[0].fullName === 'Aditya Rajendra Bobade', 'Free-text search matches company "Finastra" correctly');

  res = await fetch(`${baseUrl}/api/alumni/search?q=Societe+Generale`, { headers: authHeaders });
  data = await res.json();
  assert(res.status === 200 && data.total >= 1 && data.data[0].fullName === 'Aayushi Pradeep Gupta', 'Free-text search matches company "Societe Generale" correctly');

  res = await fetch(`${baseUrl}/api/alumni/filters`, { headers: authHeaders });
  data = await res.json();
  const yrs = data.data?.graduationYears || [];
  assert(yrs.includes(2016) && yrs.includes(2017) && yrs.includes(2018) && yrs.includes(2022), 'Filter endpoint includes all graduation years (2016, 2017, 2018, 2022)');

  // Section 5: Company Directory & Admin Reports
  console.log('\n--- Section 5: Company Directory & Admin Reports ---');
  res = await fetch(`${baseUrl}/api/alumni/company-directory`, { headers: authHeaders });
  data = await res.json();
  assert(res.status === 200 && data.totalCompanies >= 90, 'Company directory aggregates distinct hiring organizations correctly', `Total: ${data.totalCompanies}`);

  res = await fetch(`${baseUrl}/api/admin/reports/summary`, { headers: authHeaders });
  data = await res.json();
  assert(res.status === 200 && data.data?.companyCounts?.length >= 90, 'Admin summary reflects database company distribution', `Count: ${data.data?.companyCounts?.length}`);
  assert(data.data?.availableYears?.includes(2016) && data.data?.availableYears?.includes(2017) && data.data?.availableYears?.includes(2018), 'Admin summary includes CSV batches in availableYears');

  // Section 6: Idempotency Verification
  console.log('\n--- Section 6: Idempotent Re-Import Verification ---');
  const repeatReport = await importCsvAlumni({ silent: true });
  assert(repeatReport.inserted === 0, 'Re-running importer inserts ZERO duplicate records', `Inserted: ${repeatReport.inserted}`);
  assert(repeatReport.duplicates === 64, 'Re-running importer correctly identifies all 64 records as existing/duplicates', `Duplicates: ${repeatReport.duplicates}`);

  // Section 7: User Registration Linking Workflow
  console.log('\n--- Section 7: Verified Account Registration Linking ---');
  const testAlumniEmail = `test.activation.${Date.now()}@kkwagh.edu.in`;
  // Create an unlinked profile
  const unlinkedProfile = await AlumniProfile.create({
    fullName: 'Activation Test Alumnus',
    email: testAlumniEmail,
    graduationYear: 2017,
    batch: '2016-2017',
    currentCompany: 'Activation Test Co',
    verificationStatus: 'verified',
  });

  // Now simulate self-registration with that email
  res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Activation Test Alumnus',
      email: testAlumniEmail,
      password: 'StrongPassword@123',
      role: 'alumni',
    }),
  });
  data = await res.json();
  assert(res.status === 201, 'Self-registration succeeds for alumni email', `Status: ${res.status}`);

  const updatedProfile = await AlumniProfile.findById(unlinkedProfile._id);
  assert(updatedProfile.user !== null && updatedProfile.user !== undefined, 'Pre-imported profile automatically linked to newly registered User ID');

  // Clean up test activation user and profile
  await User.deleteOne({ email: testAlumniEmail });
  await AlumniProfile.deleteOne({ _id: unlinkedProfile._id });

  server.close();
  await mongoose.disconnect();

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('='.repeat(70));

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('✓ ALL INTEGRATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
