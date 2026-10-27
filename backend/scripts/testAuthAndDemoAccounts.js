const assert = require('assert');
const bcrypt = require('bcrypt');
const {
  PRIMARY_ADMIN,
  PRIMARY_TEACHER,
  PRIMARY_STUDENT,
  PRIMARY_ALUMNI,
} = require('../config/bootstrap');
const { sanitizeAlumni } = require('../controllers/alumniController');
const { normalizeLinkedInUrl } = require('../utils/helpers');

console.log('=== TEST 1: Verified Demo Accounts Configuration & Security ===');

// All 4 primary roles must be defined
const accounts = [
  { role: 'admin', acc: PRIMARY_ADMIN },
  { role: 'teacher', acc: PRIMARY_TEACHER },
  { role: 'student', acc: PRIMARY_STUDENT },
  { role: 'alumni', acc: PRIMARY_ALUMNI },
];

for (const { role, acc } of accounts) {
  assert(acc, `Missing primary demo account for role: ${role}`);
  assert.strictEqual(acc.role, role, `Role mismatch for ${acc.email}: expected ${role}, got ${acc.role}`);
  assert(acc.email.endsWith('@kkwagh.edu.in'), `Email must be institutional (@kkwagh.edu.in): ${acc.email}`);
  assert(acc.password && acc.password.length >= 6, `Password must be at least 6 characters for ${acc.email}`);
  assert.strictEqual(acc.isVerified, true, `Demo account must be pre-verified: ${acc.email}`);
  assert.strictEqual(acc.status, 'active', `Demo account must be active: ${acc.email}`);
  console.log(`  PASS: Verified ${role.toUpperCase()} demo configuration (${acc.email})`);
}

console.log('\n=== TEST 2: Password Security & Hashing Validation ===');
const testPlain = 'name@123';
const hash = bcrypt.hashSync(testPlain, 10);
assert(bcrypt.compareSync(testPlain, hash), 'Bcrypt compare must succeed for valid password');
assert(!bcrypt.compareSync('WrongPassword', hash), 'Bcrypt compare must fail for incorrect password');
console.log('  PASS: Password hashing and comparison functions securely');

console.log('\n=== TEST 3: Institutional Email Validation Rule ===');
const allowedDomain = 'kkwagh.edu.in';
const checkEmail = (e) => new RegExp(`^[a-zA-Z0-9._%+-]+@${allowedDomain.replace('.', '\\.')}$`, 'i').test(e);

assert(checkEmail('student@kkwagh.edu.in'), 'Official student email should be accepted');
assert(checkEmail('faculty.guide@kkwagh.edu.in'), 'Official faculty email should be accepted');
assert(!checkEmail('hacker@gmail.com'), 'Public gmail must be rejected');
assert(!checkEmail('alumni@yahoo.com'), 'Public yahoo must be rejected');
assert(!checkEmail('user@othercollege.edu.in'), 'Other college domain must be rejected');
console.log('  PASS: Strict institutional @kkwagh.edu.in domain validation verified');

console.log('\n=== TEST 4: LinkedIn URL Normalization & Validation ===');
assert.strictEqual(normalizeLinkedInUrl('https://linkedin.com/in/rohan'), 'https://linkedin.com/in/rohan');
assert.strictEqual(normalizeLinkedInUrl('http://www.linkedin.com/in/sneha'), 'http://www.linkedin.com/in/sneha');
assert.strictEqual(normalizeLinkedInUrl('linkedin.com/in/amit'), 'https://linkedin.com/in/amit');
assert.strictEqual(normalizeLinkedInUrl('invalid-url'), '', 'Invalid URLs must return empty string');
assert.strictEqual(normalizeLinkedInUrl('javascript:alert(1)'), '', 'XSS/javascript schemes must return empty string');
console.log('  PASS: LinkedIn URL validation and XSS prevention verified');

console.log('\n=== TEST 5: Privacy Enforcement & Phone Number Exclusion ===');
const profileWithSensitive = {
  fullName: 'Aarav Mehta',
  currentCompany: 'Google',
  currentJobTitle: 'Software Engineer',
  phone: '9876543210',
  secondaryPhone: '9876543211',
  secondary_phone: '9876543212',
  linkedinUrl: 'https://linkedin.com/in/aarav',
  linkedinVisibility: 'private',
  linkedinConfirmed: false,
};

const sanitized = sanitizeAlumni(profileWithSensitive, null);
assert.strictEqual(sanitized.phone, undefined, 'Phone must never be exposed');
assert.strictEqual(sanitized.secondaryPhone, undefined, 'secondaryPhone must never be exposed');
assert.strictEqual(sanitized.secondary_phone, undefined, 'secondary_phone must never be exposed');
assert.strictEqual(sanitized.linkedinUrl, null, 'Private unconfirmed LinkedIn must be null for public');
assert.strictEqual(sanitized.linkedinProtected, true, 'linkedinProtected flag must indicate private status');
console.log('  PASS: Zero phone numbers exposed, privacy strictly enforced');

console.log('\n=== ALL AUTH & SECURITY TESTS PASSED! ===');
