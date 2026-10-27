/**
 * Comprehensive Verification & Security Test Suite:
 * - Administrator Verification Enforcement (Registered -> Pending -> Approved / Rejected)
 * - Server-Side Authorization & Tamper Prevention
 * - Dynamic Status Revalidation & Data Privacy Protection
 */
const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const { createApp } = require('../server');
const { initSocket } = require('../socket');
const { bootstrapPrimaryAdmin } = require('../config/bootstrap');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');

let passCount = 0;
let failCount = 0;

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${desc} -> ${err.message}`);
    failCount++;
  }
}

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
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            json = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      }
    );

    req.on('error', reject);
    if (reqData) req.write(reqData);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('AlumniConnect Security & Verification Test Suite');
  console.log('======================================================\n');

  await connectDB();
  await bootstrapPrimaryAdmin();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  console.log(`Test server running on port ${port}\n`);

  const ts = Date.now();
  const testStudentEmail = `test_student_${ts}@kkwagh.edu.in`;
  const testAlumniEmail = `test_alumni_${ts}@kkwagh.edu.in`;
  const testTamperEmail = `test_tamper_${ts}@kkwagh.edu.in`;

  let studentToken = '';
  let studentUserId = '';
  let alumniToken = '';
  let alumniUserId = '';
  let adminToken = '';

  try {
    // Admin login
    const adminLoginRes = await makeRequest(server, 'POST', '/api/auth/login', {
      email: 'admin@kkwagh.edu.in',
      password: process.env.ADMIN_PASSWORD || 'admin@123',
    });
    assert.strictEqual(adminLoginRes.status, 200, `Admin login must succeed (got ${adminLoginRes.status})`);
    adminToken = adminLoginRes.body.token;

    // Test 1: New student registration receives pending status
    await itAsync('1. New user registration receives pending status (isVerified=false, verificationStatus="pending")', async () => {
      const res = await makeRequest(server, 'POST', '/api/auth/register', {
        name: 'Pending Test Student',
        email: testStudentEmail,
        password: 'Password@123',
        role: 'student',
      });
      assert.strictEqual(res.status, 201, `Registration should succeed (got ${res.status})`);
      studentToken = res.body.token;
      studentUserId = res.body.user._id || res.body.user.id;

      const userInDb = await User.findById(studentUserId);
      assert.strictEqual(userInDb.verificationStatus, 'pending', 'User verificationStatus must be pending');
      assert.strictEqual(userInDb.isVerified, false, 'User isVerified must be false');
    });

    // Test 2: Pending user can log in successfully
    await itAsync('2. Pending user can log in successfully and receives JWT without auto-promotion', async () => {
      const res = await makeRequest(server, 'POST', '/api/auth/login', {
        email: testStudentEmail,
        password: 'Password@123',
      });
      assert.strictEqual(res.status, 200, 'Pending user login must return 200');
      assert(res.body.token, 'Response must include JWT token');
      assert.strictEqual(res.body.user.verificationStatus, 'pending', 'Response must show verificationStatus=pending');
      assert.strictEqual(res.body.user.isVerified, false, 'Response must show isVerified=false');

      // Crucial root-cause regression check: did login mutate the database to isVerified=true?
      const userInDb = await User.findById(studentUserId);
      assert.strictEqual(userInDb.isVerified, false, 'Database must NOT auto-promote isVerified to true on login');
    });

    // Test 3: Pending user receives 403 on protected endpoints
    await itAsync('3. Pending user receives 403 Forbidden with exact warning message on protected endpoints', async () => {
      const endpoints = [
        { path: '/api/alumni/company-directory', method: 'GET' },
        { path: '/api/alumni/search', method: 'GET' },
        { path: '/api/jobs', method: 'GET' },
        { path: '/api/mentorship', method: 'GET' },
        { path: '/api/referrals', method: 'GET' },
        { path: '/api/connections', method: 'GET' },
        { path: '/api/messages', method: 'GET' },
      ];

      for (const ep of endpoints) {
        const res = await makeRequest(server, ep.method, ep.path, null, {
          Authorization: `Bearer ${studentToken}`,
        });
        assert.strictEqual(res.status, 403, `${ep.path} must return 403 Forbidden for pending user (got ${res.status})`);
        assert.strictEqual(res.body.code, 'PENDING_VERIFICATION', `${ep.path} must return PENDING_VERIFICATION code`);
        assert(
          res.body.message.includes('Your profile is awaiting college administrator verification'),
          `${ep.path} must return expected verification message`
        );
      }
    });

    // Test 4: Pending user blocked from admin endpoints
    await itAsync('4. Pending user receives 403 on administrative endpoints', async () => {
      const res = await makeRequest(server, 'GET', '/api/admin/stats', null, {
        Authorization: `Bearer ${studentToken}`,
      });
      assert.strictEqual(res.status, 403, 'Non-admin must receive 403 on admin routes');
    });

    // Test 5: Payload tampering prevention on registration
    await itAsync('5. Payload tampering prevention: User cannot self-approve or escalate role during registration', async () => {
      // Attempt 1: Maliciously trying to register as admin is blocked
      const adminAttemptRes = await makeRequest(server, 'POST', '/api/auth/register', {
        name: 'Hacker User',
        email: `hacker_${Date.now()}@kkwagh.edu.in`,
        password: 'Password@123',
        role: 'admin',
      });
      assert.strictEqual(adminAttemptRes.status, 400, 'Admin self-registration must be blocked with 400');

      // Attempt 2: Maliciously injecting verificationStatus=verified and isVerified=true is stripped
      const res = await makeRequest(server, 'POST', '/api/auth/register', {
        name: 'Hacker User',
        email: testTamperEmail,
        password: 'Password@123',
        role: 'student',
        isVerified: true,
        verificationStatus: 'verified',
      });
      assert.strictEqual(res.status, 201, 'Registration with valid role should succeed');
      const tamperUser = await User.findOne({ email: testTamperEmail });
      assert.strictEqual(tamperUser.verificationStatus, 'pending', 'Tampered verificationStatus must remain pending');
      assert.strictEqual(tamperUser.isVerified, false, 'Tampered isVerified must remain false');
    });

    // Test 6: Payload tampering prevention on profile updates
    await itAsync('6. Payload tampering prevention: Alumni profile update cannot alter verificationStatus or role', async () => {
      // Register alumni
      const regRes = await makeRequest(server, 'POST', '/api/auth/register', {
        name: 'Pending Alumni User',
        email: testAlumniEmail,
        password: 'Password@123',
        role: 'alumni',
      });
      alumniToken = regRes.body.token;
      alumniUserId = regRes.body.user._id || regRes.body.user.id;

      // Alumni attempts to tamper profile
      const updateRes = await makeRequest(
        server,
        'PUT',
        '/api/alumni/profile',
        {
          currentCompany: 'TCS',
          currentJobTitle: 'Software Engineer',
          department: 'Computer Engineering',
          graduationYear: 2022,
          isVerified: true,
          verificationStatus: 'verified',
          role: 'admin',
        },
        {
          Authorization: `Bearer ${alumniToken}`,
        }
      );
      assert.strictEqual(updateRes.status, 200, 'Profile update for own profile should succeed');
      const alumniInDb = await AlumniProfile.findOne({ user: alumniUserId });
      assert.strictEqual(alumniInDb.verificationStatus, 'pending', 'AlumniProfile verificationStatus must remain pending');
      const userInDb = await User.findById(alumniUserId);
      assert.strictEqual(userInDb.isVerified, false, 'User isVerified must remain false');
      assert.strictEqual(userInDb.role, 'alumni', 'User role must remain alumni');
    });

    // Test 7: Unauthenticated requests receive 401 Unauthorized
    await itAsync('7. Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
      const res = await makeRequest(server, 'GET', '/api/alumni/company-directory');
      assert.strictEqual(res.status, 401, 'Unauthenticated request must return 401');
    });

    // Test 8: Admin views pending verification requests
    await itAsync('8. Admin views pending verification requests in both User and Alumni endpoints', async () => {
      const userRes = await makeRequest(server, 'GET', '/api/admin/users?verificationStatus=pending', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(userRes.status, 200, 'Admin list users must return 200');
      const pendingUsers = userRes.body.data;
      const foundStudent = pendingUsers.find((u) => u.email === testStudentEmail);
      assert(foundStudent, 'Pending student must appear in admin pending users list');

      const alumniRes = await makeRequest(server, 'GET', '/api/admin/alumni?status=pending', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(alumniRes.status, 200, 'Admin list alumni must return 200');
      const pendingAlumni = alumniRes.body.data;
      const foundAlumni = pendingAlumni.find(
        (a) => a.email === testAlumniEmail || a.fullName === 'Pending Alumni User' || String(a.user) === String(alumniUserId)
      );
      assert(foundAlumni, 'Pending alumni must appear in admin pending alumni list');
    });

    // Test 9: Admin approves pending user account
    await itAsync('9. Admin approves student account via PUT /api/admin/users/:id/verify', async () => {
      const res = await makeRequest(
        server,
        'PUT',
        `/api/admin/users/${studentUserId}/verify`,
        { status: 'verified', note: 'Verified by KKWAGH Admin Office' },
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(res.status, 200, 'Admin verification must return 200');
      assert.strictEqual(res.body.data.verificationStatus, 'verified', 'User status should be verified');
      assert.strictEqual(res.body.data.isVerified, true, 'User isVerified should be true');

      const userInDb = await User.findById(studentUserId);
      assert.strictEqual(userInDb.verificationStatus, 'verified');
      assert.strictEqual(userInDb.isVerified, true);
    });

    // Test 10: Approved user now gains 200 access to protected data
    await itAsync('10. Approved user now receives 200 OK on role-appropriate protected endpoints', async () => {
      const res = await makeRequest(server, 'GET', '/api/alumni/company-directory', null, {
        Authorization: `Bearer ${studentToken}`,
      });
      assert.strictEqual(res.status, 200, 'Verified student must access /api/alumni/company-directory with 200 OK');

      const jobsRes = await makeRequest(server, 'GET', '/api/jobs', null, {
        Authorization: `Bearer ${studentToken}`,
      });
      assert.strictEqual(jobsRes.status, 200, 'Verified student must access /api/jobs with 200 OK');
    });

    // Test 11: Admin rejects account and user is immediately blocked
    await itAsync('11. Admin rejects account; user immediately receives 403 on protected endpoints', async () => {
      const res = await makeRequest(
        server,
        'PUT',
        `/api/admin/users/${studentUserId}/verify`,
        { status: 'rejected', note: 'Document mismatch with college records' },
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(res.status, 200, 'Admin rejection must return 200');

      const userInDb = await User.findById(studentUserId);
      assert.strictEqual(userInDb.verificationStatus, 'rejected');
      assert.strictEqual(userInDb.isVerified, false);

      // Using the SAME JWT studentToken, request must immediately fail (dynamic DB revalidation)
      const testRes = await makeRequest(server, 'GET', '/api/alumni/company-directory', null, {
        Authorization: `Bearer ${studentToken}`,
      });
      assert.strictEqual(testRes.status, 403, 'Rejected user must be blocked with 403 Forbidden');
    });

    // Test 12: Non-admin user cannot approve or reject another account
    await itAsync('12. Non-admin user cannot approve or reject accounts (403 Forbidden)', async () => {
      const res = await makeRequest(
        server,
        'PUT',
        `/api/admin/users/${alumniUserId}/verify`,
        { status: 'verified' },
        { Authorization: `Bearer ${studentToken}` }
      );
      assert.strictEqual(res.status, 403, 'Non-admin cannot verify accounts');
    });

    // Test 13: Admin approves Alumni account via verifyAlumni endpoint and syncs User
    await itAsync('13. Admin approves alumni profile and User document is automatically synced', async () => {
      const alumniProf = await AlumniProfile.findOne({ user: alumniUserId });
      assert(alumniProf, 'Alumni profile must exist');

      const res = await makeRequest(
        server,
        'PUT',
        `/api/admin/alumni/${alumniProf._id}/verify`,
        { status: 'verified', note: 'Batch 2022 confirmed' },
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(res.status, 200, 'Admin verify alumni must return 200');

      const alumniInDb = await AlumniProfile.findById(alumniProf._id);
      assert.strictEqual(alumniInDb.verificationStatus, 'verified');

      const userInDb = await User.findById(alumniUserId);
      assert.strictEqual(userInDb.verificationStatus, 'verified', 'User verificationStatus must be synced to verified');
      assert.strictEqual(userInDb.isVerified, true, 'User isVerified must be synced to true');

      // Alumni can now query company directory
      const dirRes = await makeRequest(server, 'GET', '/api/alumni/company-directory', null, {
        Authorization: `Bearer ${alumniToken}`,
      });
      assert.strictEqual(dirRes.status, 200, 'Approved alumni now accesses company directory');
    });

    // Test 14: Logout clears cookies
    await itAsync('14. Logout endpoint clears authentication cookies', async () => {
      const res = await makeRequest(server, 'POST', '/api/auth/logout', null, {
        Authorization: `Bearer ${alumniToken}`,
      });
      assert.strictEqual(res.status, 200, 'Logout should succeed');
      const setCookie = res.headers['set-cookie'];
      assert(setCookie && setCookie.some((c) => c.includes('token=') && c.includes('Max-Age=0')), 'Token cookie must be cleared');
    });

    // Test 15: Data privacy: Unverified users cannot query private alumni contact information
    await itAsync('15. Data privacy: Unverified requests cannot access private contact details', async () => {
      const res = await makeRequest(server, 'GET', `/api/alumni/${alumniUserId}`);
      assert.strictEqual(res.status, 401, 'Unauthenticated access to specific alumni profile is rejected');

      // Create another pending student
      const pendRes = await makeRequest(server, 'POST', '/api/auth/register', {
        name: 'Another Pending Student',
        email: `pending_${Date.now()}@kkwagh.edu.in`,
        password: 'Password@123',
        role: 'student',
      });
      const pendToken = pendRes.body.token;

      const profileRes = await makeRequest(server, 'GET', `/api/alumni/${alumniUserId}`, null, {
        Authorization: `Bearer ${pendToken}`,
      });
      assert.strictEqual(profileRes.status, 403, 'Pending user cannot access another alumnus profile');
    });

  } finally {
    // Cleanup created test records
    await User.deleteMany({
      email: { $in: [testStudentEmail, testAlumniEmail, testTamperEmail] },
    });
    await AlumniProfile.deleteMany({
      email: { $in: [testStudentEmail, testAlumniEmail, testTamperEmail] },
    });

    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
  }

  console.log('\n======================================================');
  console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
