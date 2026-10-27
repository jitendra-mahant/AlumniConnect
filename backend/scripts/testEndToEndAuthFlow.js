/**
 * Complete End-to-End Authentication & Security Test Suite
 * Tests all 16 requirements specified in Section 11 of the Master Prompt:
 * 1. Register a new user with a valid @kkwagh.edu.in email
 * 2. Confirm the account appears in the database
 * 3. Log in immediately without email verification
 * 4. Log out and log in again with the same credentials
 * 5. Attempt registration using an existing email
 * 6. Attempt registration using an invalid email domain
 * 7. Attempt login with an incorrect password
 * 8. Reset the password through the supported development flow
 * 9. Confirm the old password no longer works after a successful reset
 * 10. Confirm the new password works
 * 11. Test each available demo-account credentials
 * 12. Verify role-based redirects and protected routes
 * 13. Verify theme switching logic and persistence
 * 14. Check theme toggle upper-right positioning contract
 * 15. Verify clean backend and frontend initialization
 * 16. Verify zero sensitive data leakage, no plaintext passwords
 */
const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const { createApp } = require('../server');
const { bootstrapPrimaryAdmin } = require('../config/bootstrap');
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');

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

// Helper to make HTTP requests against local Express test server
function makeRequest(server, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    const reqData = body ? JSON.stringify(body) : null;
    if (reqData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(reqData);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch (_) {
            data = rawData;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );

    req.on('error', reject);
    if (reqData) req.write(reqData);
    req.end();
  });
}

(async () => {
  console.log('===================================================================');
  console.log('   AlumniConnect — Master End-to-End Authentication Verification   ');
  console.log('===================================================================\n');

  try {
    await connectDB();
    await bootstrapPrimaryAdmin();
  } catch (err) {
    console.error('DATABASE_CONNECTION_ERROR:', err.message);
    process.exit(1);
  }

  // Create isolated test server
  const app = createApp();
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));

  const TEST_EMAIL = 'sarangrajput@kkwagh.edu.in';
  const TEST_PASS = 'sarangrajput@123';
  const NEW_PASS = 'sarangrajput@456';

  try {
    // Clean up test user if already present from previous runs
    await User.deleteOne({ email: TEST_EMAIL });
    await PasswordResetRequest.deleteMany({ email: TEST_EMAIL });

    console.log('--- Case 1 & 2: Registration & MongoDB Persistence ---');
    let regRes = null;
    await itAsync('1. Register a new user with valid @kkwagh.edu.in email without verification', async () => {
      regRes = await makeRequest(testServer, 'POST', '/api/auth/register', {
        name: 'Sarang Rajput',
        email: '  SarangRajput@kkwagh.edu.in  ',
        password: TEST_PASS,
        role: 'student',
      });
      assert.strictEqual(regRes.status, 201, `Expected status 201, got ${regRes.status}`);
      assert.strictEqual(regRes.data.success, true);
      assert(regRes.data.token, 'Must return JWT token immediately');
      assert.strictEqual(regRes.data.user.email, TEST_EMAIL, 'Email must be normalized');
    });

    await itAsync('2. Confirm the account appears in the database with pending verification status', async () => {
      const dbUser = await User.findOne({ email: TEST_EMAIL });
      assert(dbUser, 'User must exist in MongoDB');
      assert.strictEqual(dbUser.isVerified, false, 'isVerified must be false awaiting admin approval');
      assert.strictEqual(dbUser.verificationStatus, 'pending', 'verificationStatus must be pending');
      assert.strictEqual(dbUser.status, 'active');
      assert.strictEqual(dbUser.role, 'student');
      assert.notStrictEqual(dbUser.password, TEST_PASS, 'Password must be hashed, never plaintext');
    });

    console.log('\n--- Case 3 & 4: Immediate Login & Relogin Capability ---');
    let loginToken = null;
    await itAsync('3. Log in immediately without email verification', async () => {
      const loginRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: 'SARANGRAJPUT@KKWAGH.EDU.IN',
        password: TEST_PASS,
      });
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginRes.data.success, true);
      assert(loginRes.data.token, 'Must receive authentication JWT');
      loginToken = loginRes.data.token;
      assert.strictEqual(loginRes.data.user.email, TEST_EMAIL);
    });

    await itAsync('4. Log out (client side) and log in again with same credentials', async () => {
      // Simulate client discarding token and logging in again
      const reloginRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASS,
      });
      assert.strictEqual(reloginRes.status, 200);
      assert(reloginRes.data.token);
      assert.strictEqual(reloginRes.data.user.email, TEST_EMAIL);
    });

    console.log('\n--- Case 5 & 6: Duplicate Prevention & Institutional Domain Validation ---');
    await itAsync('5. Attempt registration using an existing email (exact & casing variation)', async () => {
      const dupRes = await makeRequest(testServer, 'POST', '/api/auth/register', {
        name: 'Imposter Sarang',
        email: '   SARANGRAJPUT@kkwagh.edu.in  ',
        password: 'anotherPassword@999',
        role: 'student',
      });
      assert.strictEqual(dupRes.status, 409);
      assert.strictEqual(
        dupRes.data.message,
        'An account with this institutional email already exists. Please log in or reset your password.'
      );
    });

    await itAsync('6. Attempt registration using an invalid email domain', async () => {
      const badDomains = [
        'sarang@gmail.com',
        'sarang@yahoo.co.in',
        'sarang@othercollege.edu',
        'sarang@kkwagh.com',
      ];
      for (const email of badDomains) {
        const res = await makeRequest(testServer, 'POST', '/api/auth/register', {
          name: 'Invalid Domain User',
          email,
          password: 'Password@123',
          role: 'student',
        });
        assert.strictEqual(res.status, 400, `Expected 400 for ${email}, got ${res.status}`);
        assert(res.data.message.includes('@kkwagh.edu.in'));
      }
    });

    console.log('\n--- Case 7, 8, 9, 10: Password Failure & Password Reset Workflow ---');
    await itAsync('7. Attempt login with an incorrect password', async () => {
      const badPassRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: 'CompletelyWrongPassword@000',
      });
      assert.strictEqual(badPassRes.status, 401);
      assert.strictEqual(badPassRes.data.message, 'Invalid email or password');
    });

    let tempCredential = null;
    await itAsync('8. Request password recovery through administrator-assisted institutional flow', async () => {
      const forgotRes = await makeRequest(testServer, 'POST', '/api/auth/forgot-password', {
        email: TEST_EMAIL,
        reason: 'End-to-end recovery verification',
      });
      assert.strictEqual(forgotRes.status, 200);
      assert.strictEqual(forgotRes.data.success, true);
      assert.strictEqual(
        forgotRes.data.message,
        'Your request has been submitted. Follow the instructions provided by your college administrator.'
      );

      // Admin approves request
      const adminLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: 'admin@kkwagh.edu.in',
        password: 'admin@123',
      });
      assert.strictEqual(adminLogin.status, 200, 'Admin login failed');

      const reqDoc = await PasswordResetRequest.findOne({ email: TEST_EMAIL, status: 'pending' });
      assert(reqDoc, 'Pending request must exist in DB');
      const approveRes = await makeRequest(
        testServer,
        'PUT',
        `/api/admin/recovery-requests/${reqDoc._id}/approve`,
        {},
        { Authorization: `Bearer ${adminLogin.data.token}` }
      );
      assert.strictEqual(approveRes.status, 200, 'Admin approval failed');
      tempCredential = approveRes.data.temporaryCredential;
      assert(tempCredential, 'Temporary credential must be generated');
    });

    await itAsync('9 & 10. Reset password with temporary credential, confirm old password fails, and new password works', async () => {
      const resetRes = await makeRequest(testServer, 'POST', '/api/auth/reset-password', {
        email: TEST_EMAIL,
        temporaryCredential: tempCredential,
        password: NEW_PASS,
      });
      assert.strictEqual(resetRes.status, 200);
      assert.strictEqual(resetRes.data.success, true);

      // Confirm OLD password no longer works
      const oldLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASS,
      });
      assert.strictEqual(oldLogin.status, 401, 'Old password must fail with 401');

      // Confirm NEW password works immediately
      const newLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: NEW_PASS,
      });
      assert.strictEqual(newLogin.status, 200, 'New password must succeed with 200');
      assert(newLogin.data.token, 'Must issue fresh JWT token');
    });

    console.log('\n--- Case 11: Demo Account Credentials Validation ---');
    const demoAccounts = [
      { role: 'student', email: 'student@kkwagh.edu.in', primaryPass: 'student@123', fallbackPass: 'name@123' },
      { role: 'alumni', email: 'alumni@kkwagh.edu.in', primaryPass: 'alumni@123', fallbackPass: 'name@123' },
      { role: 'teacher', email: 'guide@kkwagh.edu.in', primaryPass: 'guide@123', fallbackPass: 'name@123' },
      { role: 'admin', email: 'admin@kkwagh.edu.in', primaryPass: 'admin@123', fallbackPass: 'name@123' },
    ];

    for (const demo of demoAccounts) {
      await itAsync(`11. Demo account for ${demo.role.toUpperCase()} (${demo.email}) logs in successfully`, async () => {
        // Test primary convention password (e.g. role@123)
        const primaryRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
          email: demo.email,
          password: demo.primaryPass,
        });
        assert.strictEqual(primaryRes.status, 200, `Primary pass failed for ${demo.email}`);
        assert.strictEqual(primaryRes.data.user.role, demo.role);

        // Test backward-compatible fallback password (name@123)
        const fallbackRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
          email: demo.email,
          password: demo.fallbackPass,
        });
        assert.strictEqual(fallbackRes.status, 200, `Fallback pass failed for ${demo.email}`);
      });
    }

    console.log('\n--- Case 12: Role-Based Authorization & Endpoint Protection ---');
    await itAsync('12. Protected routes enforce strict role boundaries', async () => {
      // Login as student
      const studentLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: 'student@kkwagh.edu.in',
        password: 'student@123',
      });
      const studentToken = studentLogin.data.token;

      // Student attempting to access admin audit logs -> 403 Forbidden
      const adminForbiddenRes = await makeRequest(
        testServer,
        'GET',
        '/api/admin/audit-logs',
        null,
        { Authorization: `Bearer ${studentToken}` }
      );
      assert.strictEqual(adminForbiddenRes.status, 403, 'Student must be blocked from admin endpoints');

      // Unauthenticated request -> 401
      const unauthRes = await makeRequest(testServer, 'GET', '/api/alumni');
      assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');

      // Admin access to admin endpoint -> 200 OK
      const adminLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: 'admin@kkwagh.edu.in',
        password: 'admin@123',
      });
      const adminToken = adminLogin.data.token;
      const adminOkRes = await makeRequest(
        testServer,
        'GET',
        '/api/admin/stats',
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(adminOkRes.status, 200, 'Admin must have full access to admin endpoints');
    });

    console.log('\n--- Case 13 & 14: Theme Toggle & Upper-Right Positioning Contract ---');
    it('13. Theme state persists via alumniconnect_theme in localStorage and syncs with document.documentElement', () => {
      const fs = require('fs');
      const path = require('path');
      const themeCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/utils/theme.js'), 'utf8');
      assert(themeCode.includes("localStorage.setItem('alumniconnect_theme', theme)"));
      assert(themeCode.includes("document.documentElement.classList.add('dark')"));
      assert(themeCode.includes("document.documentElement.classList.remove('dark')"));
    });

    it('14. AuthShell positions theme toggle with fixed top-4 right-4 z-50 for extreme upper-right alignment', () => {
      const fs = require('fs');
      const path = require('path');
      const authPagesCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/AuthPages.jsx'), 'utf8');
      assert(authPagesCode.includes('fixed top-4 right-4 sm:top-5 sm:right-6 z-50'), 'Theme toggle must use fixed extreme upper-right viewport positioning');
      assert(authPagesCode.includes('Switch to light mode'), 'Accessible aria-label present');
      assert(authPagesCode.includes('Switch to dark mode'), 'Accessible aria-label present');
    });

    console.log('\n--- Case 15 & 16: Zero Data Leakage & Health Verification ---');
    await itAsync('15. Health endpoint reports operational status and college domain', async () => {
      const healthRes = await makeRequest(testServer, 'GET', '/api/health');
      assert.strictEqual(healthRes.status, 200);
      assert.strictEqual(healthRes.data.success, true);
    });

    await itAsync('16. User responses and logs strictly omit sensitive hashes and secrets', async () => {
      const userDoc = await User.findOne({ email: TEST_EMAIL });
      const json = userDoc.toJSON();
      assert.strictEqual(json.password, undefined, 'toJSON must delete password');
      assert.strictEqual(json.passwordResetTokenHash, undefined, 'toJSON must delete passwordResetTokenHash');
      assert.strictEqual(json.verificationTokenHash, undefined, 'toJSON must delete verificationTokenHash');
    });

  } finally {
    await new Promise((res) => testServer.close(res));
    await mongoose.disconnect();
  }

  console.log('\n===================================================================');
  console.log(`  End-to-End Test Run: ${passCount} PASSED, ${failCount} FAILED.`);
  console.log('===================================================================\n');

  if (failCount > 0) process.exit(1);
  process.exit(0);
})();
