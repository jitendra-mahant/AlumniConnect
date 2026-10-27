const assert = require('assert');
const { RAW_2022_RECORDS, normalizeCompanyName } = require('../services/import2022Service');
const { sanitizeAlumni } = require('../controllers/alumniController');

console.log('=== TEST 1: Verifying 2022 Dataset Integrity & Strict Phone Exclusion ===');
assert.strictEqual(RAW_2022_RECORDS.length, 48, 'Expected 48 unique alumni records');

// Verify zero phone numbers exist in RAW_2022_RECORDS
for (const r of RAW_2022_RECORDS) {
  assert.strictEqual(r.phone, undefined, `Record ${r.name} has phone field`);
  assert.strictEqual(r.secondary_phone, undefined, `Record ${r.name} has secondary_phone field`);
  assert.strictEqual(r.secondaryPhone, undefined, `Record ${r.name} has secondaryPhone field`);
}
console.log('  PASS: All 48 records loaded with zero phone/secondary_phone fields');

console.log('\n=== TEST 2: Company Normalization & Variant Detection ===');
assert.strictEqual(normalizeCompanyName('FinIQ'), 'FinIQ');
assert.strictEqual(normalizeCompanyName('FiniQ Consulting'), 'FinIQ');
assert.strictEqual(normalizeCompanyName('Vegyan Systems'), 'Vegayan Systems');
assert.strictEqual(normalizeCompanyName('Vegayan Systems'), 'Vegayan Systems');
assert.strictEqual(normalizeCompanyName(''), 'Company Not Specified');
assert.strictEqual(normalizeCompanyName(null), 'Company Not Specified');
console.log('  PASS: Company normalization correctly detects variants (FinIQ, Vegayan Systems)');

console.log('\n=== TEST 3: LinkedIn Visibility & Privacy Server Enforcement ===');
// Mock profile with private LinkedIn
const mockProfile = {
  fullName: 'Priya Sharma',
  currentCompany: 'Google',
  currentJobTitle: 'Senior Software Engineer',
  phone: '9876543210', // simulate legacy field that might exist
  secondary_phone: '9876543211',
  linkedinUrl: 'https://linkedin.com/in/priyasharma',
  linkedinConfirmed: false,
  linkedinVisibility: 'private',
  user: '65f01234567890abcdef1111',
};

// 3a. Public visitor: must never see phone, must never see unconfirmed/private LinkedIn
const publicViewResult = sanitizeAlumni(mockProfile, null);
assert.strictEqual(publicViewResult.phone, undefined, 'Phone must be stripped');
assert.strictEqual(publicViewResult.secondary_phone, undefined, 'Secondary phone must be stripped');
assert.strictEqual(publicViewResult.linkedinUrl, null, 'Private LinkedIn must be hidden for public');
assert.strictEqual(publicViewResult.linkedinProtected, true, 'linkedinProtected flag must be true');
console.log('  PASS: Public visitor cannot see private LinkedIn and phone is strictly stripped');

// 3b. Authenticated Student when alumni has private LinkedIn: must NOT see LinkedIn
const studentViewer = { _id: '65f01234567890abcdef2222', role: 'student' };
const studentViewResult = sanitizeAlumni(mockProfile, studentViewer);
assert.strictEqual(studentViewResult.linkedinUrl, null, 'Private LinkedIn must be hidden for student');
assert.strictEqual(studentViewResult.linkedinProtected, true);
console.log('  PASS: Authenticated student cannot see unconfirmed/private LinkedIn');

// 3c. Confirmed with verified_students_and_alumni: student CAN see LinkedIn
const sharedProfile = {
  ...mockProfile,
  linkedinConfirmed: true,
  linkedinVisibility: 'verified_students_and_alumni',
};
const sharedResult = sanitizeAlumni(sharedProfile, studentViewer);
assert.strictEqual(sharedResult.linkedinUrl, 'https://linkedin.com/in/priyasharma', 'Allowed for verified students');
assert.strictEqual(sharedResult.phone, undefined, 'Phone is still strictly stripped');
console.log('  PASS: Permitted viewers can see confirmed LinkedIn, phone remains strictly stripped');

// 3d. Administrator: can see all directory information for moderation
const adminViewer = { _id: '65f01234567890abcdef3333', role: 'admin' };
const adminResult = sanitizeAlumni(mockProfile, adminViewer);
assert.strictEqual(adminResult.linkedinUrl, 'https://linkedin.com/in/priyasharma', 'Admin can see LinkedIn for audit');
assert.strictEqual(adminResult.phone, undefined, 'Admin output also has phone strictly stripped');
console.log('  PASS: Admin gets full moderation view with strictly zero phone numbers');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
