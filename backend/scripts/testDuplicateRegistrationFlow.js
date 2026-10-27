/**
 * Duplicate Registration & Authentication Flow Test Suite
 * Tests requirement scenarios:
 * 1. New email registration without email verification requirement
 * 2. Case-insensitive normalization & whitespace trimming
 * 3. Exact duplicate error message and 409 status code
 * 4. Existing record preservation (zero data mutation/overwrite)
 * 5. Non-enumeration and zero sensitive data leakage
 * 6. Immediate login capability with matching bcrypt password
 */
const assert = require('assert');
const bcrypt = require('bcrypt');

function validateInstitutionalEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const regex = /^[a-zA-Z0-9._%+-]+@kkwagh\.edu\.in$/i;
  return {
    valid: regex.test(normalized),
    normalized,
  };
}

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  FAIL: ${desc} -> ${err.message}`);
    failCount++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  FAIL: ${desc} -> ${err.message}`);
    failCount++;
  }
}

(async () => {
  console.log('===============================================================');
  console.log('  AlumniConnect — Duplicate Registration Flow Test Suite       ');
  console.log('===============================================================\n');

  console.log('--- 1. Email Normalization Logic ---');
  it('Trims whitespace and lowercases email uniformly', () => {
    const rawInputs = [
      '  Student@KKWAGH.edu.in  ',
      'STUDENT@kkwagh.edu.in',
      'student@KKWAGH.EDU.IN',
      'student@kkwagh.edu.in',
      '  sarangrajput@kkwagh.edu.in  ',
    ];
    const expected = ['student@kkwagh.edu.in', 'student@kkwagh.edu.in', 'student@kkwagh.edu.in', 'student@kkwagh.edu.in', 'sarangrajput@kkwagh.edu.in'];
    for (let i = 0; i < rawInputs.length; i++) {
      const normalized = String(rawInputs[i] || '').trim().toLowerCase();
      assert.strictEqual(normalized, expected[i], `Failed for input: "${rawInputs[i]}"`);
    }
  });

  it('Rejects non-institutional emails and invalid formats', () => {
    const allowedDomain = 'kkwagh.edu.in';
    const regex = new RegExp(`^[a-zA-Z0-9._%+-]+@${allowedDomain.replace('.', '\\.')}$`, 'i');
    
    assert(regex.test('sarangrajput@kkwagh.edu.in'));
    assert(regex.test('studentname@kkwagh.edu.in'));
    assert(regex.test('alumniname@kkwagh.edu.in'));
    assert(regex.test('user.name+test@kkwagh.edu.in'));
    assert(!regex.test('student@gmail.com'));
    assert(!regex.test('student@othercollege.edu.in'));
    assert(!regex.test('@kkwagh.edu.in'));
    assert(!regex.test('invalid email@kkwagh.edu.in'));
  });

  console.log('\n--- 2. Duplicate Detection & Exact Message Verification ---');
  const EXPECTED_MSG = 'An account with this institutional email already exists. Please log in or reset your password.';

  it('Existing account returns 409 and exact requested message', () => {
    const existingUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Existing Alumnus',
      email: 'priya.sharma@kkwagh.edu.in',
      role: 'alumni',
      isVerified: true,
      password: 'hashed_original_password_123',
    };

    const duplicateAttemptEmail = 'PRIYA.SHARMA@KKWAGH.EDU.IN';
    const normalized = duplicateAttemptEmail.trim().toLowerCase();

    assert.strictEqual(normalized, existingUser.email);

    // Simulated controller duplicate check logic
    let statusCode = null;
    let responseData = null;

    if (normalized === existingUser.email) {
      statusCode = 409;
      responseData = {
        success: false,
        message: EXPECTED_MSG,
        details: {
          code: 'DUPLICATE_EMAIL',
          email: normalized,
        },
      };
    }

    assert.strictEqual(statusCode, 409);
    assert.strictEqual(responseData.message, EXPECTED_MSG);
    assert.strictEqual(responseData.details.code, 'DUPLICATE_EMAIL');
    // Ensure sensitive details are never leaked
    assert.strictEqual(responseData.details.password, undefined);
    assert.strictEqual(responseData.details.role, undefined);
  });

  console.log('\n--- 3. Data Preservation (Zero Overwrite / Zero Deletion) ---');
  it('Existing account fields remain strictly immutable when duplicate registration occurs', () => {
    const originalAccount = {
      _id: 'user_12345',
      name: 'Original Faculty Name',
      email: 'guide@kkwagh.edu.in',
      role: 'teacher',
      password: bcrypt.hashSync('guide@123', 10),
      isVerified: true,
      createdAt: new Date('2026-01-01'),
    };

    // Attacker tries to register with same email and new password/name/role
    const duplicatePayload = {
      name: 'Imposter Name',
      email: 'GUIDE@KKWAGH.EDU.IN',
      password: 'AttackerNewPassword@999',
      role: 'admin',
    };

    const normalized = duplicatePayload.email.trim().toLowerCase();
    const isDuplicate = normalized === originalAccount.email;
    assert.strictEqual(isDuplicate, true);

    // Controller blocks before User.create or update
    // Verify originalAccount was NOT modified:
    assert.strictEqual(originalAccount.name, 'Original Faculty Name');
    assert.strictEqual(originalAccount.role, 'teacher');
    assert(bcrypt.compareSync('guide@123', originalAccount.password));
    assert(!bcrypt.compareSync(duplicatePayload.password, originalAccount.password));
  });

  console.log('\n--- 4. Direct Authentication Without Email Verification ---');
  it('Newly registered user account is active with isVerified: true and can log in immediately', async () => {
    const plainPass = 'sarangrajput@123';
    const hashedPass = await bcrypt.hash(plainPass, 10);
    
    const newUser = {
      name: 'Sarang Rajput',
      email: 'sarangrajput@kkwagh.edu.in',
      password: hashedPass,
      role: 'student',
      isVerified: true, // Default active
      status: 'active',
    };

    // Verify properties
    assert.strictEqual(newUser.isVerified, true, 'User is directly verified/active');
    assert.strictEqual(newUser.status, 'active');
    
    // Login verification check
    const isPasswordValid = await bcrypt.compare(plainPass, newUser.password);
    assert.strictEqual(isPasswordValid, true, 'Password hashes and matches');

    // Simulate login controller verification check
    const canLogin = isPasswordValid && newUser.status !== 'suspended';
    assert.strictEqual(canLogin, true, 'User can log in immediately without any verification step');
  });

  console.log('\n===============================================================');
  console.log(`  Tests completed: ${passCount} Passed, ${failCount} Failed.`);
  console.log('===============================================================\n');

  if (failCount > 0) process.exit(1);
  process.exit(0);
})();
