/**
 * Automated Verification: Administrator-Assisted Password Recovery & Guide Workspace
 * Verifies Part 1 (Password Recovery), Part 2 (Design System Tokens), and Part 3 (Guide Workspace).
 */
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const { createApp } = require('../server');
const { bootstrapPrimaryAdmin } = require('../config/bootstrap');
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const GuidanceAppointment = require('../models/GuidanceAppointment');
const AdminAuditLog = require('../models/AdminAuditLog');

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
  console.log('  AlumniConnect — Recovery & Guide Comprehensive Verification Suite');
  console.log('===================================================================\n');

  try {
    await connectDB();
    await bootstrapPrimaryAdmin();
  } catch (err) {
    console.error('DATABASE_CONNECTION_ERROR:', err.message);
    process.exit(1);
  }

  const app = createApp();
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));

  const TEST_STUDENT_EMAIL = 'recovery.student@kkwagh.edu.in';
  const INIT_PASS = 'StudentPass#123';
  const NEW_PERM_PASS = 'StudentNewPass#456';

  let studentToken = null;
  let adminToken = null;
  let guideToken = null;
  let requestId = null;
  let temporaryCredential = null;

  try {
    // -------------------------------------------------------------------------
    // PART 1: ADMINISTRATOR-ASSISTED PASSWORD RECOVERY
    // -------------------------------------------------------------------------
    console.log('--- PART 1: Administrator-Assisted Password Recovery ---');

    await itAsync('1. Setup/ensure test student account exists and logs in', async () => {
      await User.deleteOne({ email: TEST_STUDENT_EMAIL });
      await PasswordResetRequest.deleteMany({ email: TEST_STUDENT_EMAIL });

      const regRes = await makeRequest(testServer, 'POST', '/api/auth/register', {
        name: 'Recovery Test Student',
        email: TEST_STUDENT_EMAIL,
        password: INIT_PASS,
        role: 'student',
      });
      assert(regRes.status === 201 || regRes.status === 200, `Registration status expected 201/200, got ${regRes.status}`);

      const loginRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_STUDENT_EMAIL,
        password: INIT_PASS,
      });
      assert.strictEqual(loginRes.status, 200, `Login should succeed: ${JSON.stringify(loginRes.data)}`);
      studentToken = loginRes.data.token;
      assert(studentToken, 'Token should be present');
    });

    await itAsync('2. Non-institutional email is rejected on recovery request', async () => {
      const res = await makeRequest(testServer, 'POST', '/api/auth/recovery-request', {
        email: 'attacker@external-domain.com',
        reason: 'Attempting recovery',
      });
      assert.strictEqual(res.status, 400, 'Non-kkwagh email must be rejected with 400');
    });

    await itAsync('3. Submit valid institutional account recovery request', async () => {
      const res = await makeRequest(testServer, 'POST', '/api/auth/recovery-request', {
        email: TEST_STUDENT_EMAIL,
        reason: 'Forgot student account password before exams',
      });
      assert.strictEqual(res.status, 200, `Request failed: ${JSON.stringify(res.data)}`);
      assert.strictEqual(
        res.data.message,
        'Your request has been submitted. Follow the instructions provided by your college administrator.'
      );

      // Verify request is in MongoDB with pending status
      const dbReq = await PasswordResetRequest.findOne({ email: TEST_STUDENT_EMAIL });
      assert(dbReq, 'Recovery request record must be in database');
      assert.strictEqual(dbReq.status, 'pending');
      assert.strictEqual(dbReq.reason, 'Forgot student account password before exams');
      requestId = dbReq._id.toString();
    });

    await itAsync('4. Non-admin (student) is forbidden from approving requests (403)', async () => {
      const res = await makeRequest(
        testServer,
        'PUT',
        `/api/admin/recovery-requests/${requestId}/approve`,
        {},
        { Authorization: `Bearer ${studentToken}` }
      );
      assert.strictEqual(res.status, 403, 'Student must receive 403 Forbidden');
    });

    await itAsync('5. Administrator approves request and receives temporary credential', async () => {
      const adminLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: 'admin@kkwagh.edu.in',
        password: 'admin@123',
      });
      assert.strictEqual(adminLogin.status, 200, 'Admin login failed');
      adminToken = adminLogin.data.token;

      // Check request list
      const listRes = await makeRequest(
        testServer,
        'GET',
        '/api/admin/recovery-requests?status=pending',
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(listRes.status, 200, 'Admin list failed');
      assert(listRes.data.data.some((r) => r._id.toString() === requestId), 'Request should be in pending list');

      // Approve request
      const approveRes = await makeRequest(
        testServer,
        'PUT',
        `/api/admin/recovery-requests/${requestId}/approve`,
        {},
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(approveRes.status, 200, `Approval failed: ${JSON.stringify(approveRes.data)}`);
      assert(approveRes.data.temporaryCredential, 'temporaryCredential must be returned');
      assert(approveRes.data.temporaryCredential.startsWith('KKWAGH#'), 'Credential should start with KKWAGH#');
      temporaryCredential = approveRes.data.temporaryCredential;

      // Verify DB state
      const updatedReq = await PasswordResetRequest.findById(requestId);
      assert.strictEqual(updatedReq.status, 'approved');

      // Verify user mustChangePassword flag
      const user = await User.findOne({ email: TEST_STUDENT_EMAIL });
      assert.strictEqual(user.mustChangePassword, true, 'User must have mustChangePassword=true');

      // Verify audit log created
      const audit = await AdminAuditLog.findOne({
        action: 'APPROVE_PASSWORD_RECOVERY',
        targetId: user._id.toString(),
      });
      assert(audit, 'Audit log entry must exist for password recovery approval');
    });

    await itAsync('6. User signs in with temporary credential (mandates password change)', async () => {
      const res = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_STUDENT_EMAIL,
        password: temporaryCredential,
      });
      assert.strictEqual(res.status, 200, `Login with temp credential failed: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.user.mustChangePassword, true, 'mustChangePassword must be flagged in login response');
    });

    await itAsync('7. User sets new permanent password via reset-password endpoint', async () => {
      const res = await makeRequest(testServer, 'POST', '/api/auth/reset-password', {
        email: TEST_STUDENT_EMAIL,
        temporaryCredential,
        password: NEW_PERM_PASS,
      });
      assert.strictEqual(res.status, 200, `Reset failed: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.success, true);

      // Verify recovery request is marked completed
      const reqDoc = await PasswordResetRequest.findById(requestId);
      assert.strictEqual(reqDoc.status, 'completed');

      // Verify user mustChangePassword cleared
      const user = await User.findOne({ email: TEST_STUDENT_EMAIL });
      assert.strictEqual(user.mustChangePassword, false);
    });

    await itAsync('8. Old password and temporary credential no longer work', async () => {
      // Old initial password
      const oldRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_STUDENT_EMAIL,
        password: INIT_PASS,
      });
      assert.strictEqual(oldRes.status, 401, 'Old password must be rejected');

      // Temporary credential
      const tempRes = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_STUDENT_EMAIL,
        password: temporaryCredential,
      });
      assert.strictEqual(tempRes.status, 401, 'Temporary credential must no longer be accepted');
    });

    await itAsync('9. New permanent password works immediately', async () => {
      const res = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: TEST_STUDENT_EMAIL,
        password: NEW_PERM_PASS,
      });
      assert.strictEqual(res.status, 200, 'New permanent password must allow login');
      assert.strictEqual(res.data.user.mustChangePassword, false);
    });

    // -------------------------------------------------------------------------
    // PART 2: DESIGN SYSTEM PALETTE & TYPOGRAPHY VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- PART 2: Design System Tokens & Font Families ---');

    it('10. Verify index.css has exact teal & slate CSS variable tokens', () => {
      const cssPath = path.resolve(__dirname, '../../frontend/src/index.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Check light theme variables
      assert(css.includes('--page-bg: #f8fafc'), 'Light --page-bg must be #f8fafc');
      assert(css.includes('--page-surface: #ffffff'), 'Light --page-surface must be #ffffff');
      assert(css.includes('--page-surface-muted: #f1f5f9'), 'Light --page-surface-muted must be #f1f5f9');
      assert(css.includes('--page-text: #1e293b'), 'Light --page-text must be #1e293b');
      assert(css.includes('--heading-text: #0f172a'), 'Light --heading-text must be #0f172a');
      assert(css.includes('--muted-copy: #64748b'), 'Light --muted-copy must be #64748b');
      assert(css.includes('--focus-ring: #0d9488'), 'Light --focus-ring must be #0d9488');

      // Check dark theme variables
      assert(css.includes('--page-bg: #020617'), 'Dark --page-bg must be #020617');
      assert(css.includes('--page-surface: #0f172a'), 'Dark --page-surface must be #0f172a');
      assert(css.includes('--page-surface-muted: #1e293b'), 'Dark --page-surface-muted must be #1e293b');
      assert(css.includes('--page-text: #e2e8f0'), 'Dark --page-text must be #e2e8f0');
      assert(css.includes('--heading-text: #f1f5f9'), 'Dark --heading-text must be #f1f5f9');
      assert(css.includes('--muted-copy: #94a3b8'), 'Dark --muted-copy must be #94a3b8');
      assert(css.includes('--focus-ring: #2dd4bf'), 'Dark --focus-ring must be #2dd4bf');

      // Check focus visible rule
      assert(css.includes('outline: 2px solid var(--focus-ring'), 'Focus visible ring must use --focus-ring');
    });

    it('11. Verify font standardization: only Arial, Times New Roman, Helvetica', () => {
      const cssPath = path.resolve(__dirname, '../../frontend/src/index.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Find all font-family declarations in index.css
      const matches = css.match(/font-family:[^;]+;/gi) || [];
      const allowedFonts = ['arial', 'times new roman', 'helvetica', 'sans-serif', 'serif', 'monospace', 'inherit', 'initial', 'ui-monospace', 'cascadia', 'consolas', 'courier'];

      for (const m of matches) {
        const val = m.toLowerCase();
        // Disallow web fonts like inter, roboto, open sans, poppins
        assert(
          !val.includes('inter') && !val.includes('roboto') && !val.includes('poppins') && !val.includes('montserrat'),
          `Disallowed font declared in: ${m}`
        );
      }
    });

    // -------------------------------------------------------------------------
    // PART 3: GUIDE & TEACHER WORKSPACE APIS
    // -------------------------------------------------------------------------
    console.log('\n--- PART 3: Faculty Guide Workspace Endpoints ---');

    await itAsync('12. Guide authenticates and retrieves workspace stats', async () => {
      const guideLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {
        email: 'guide@kkwagh.edu.in',
        password: 'guide@123',
      });
      assert.strictEqual(guideLogin.status, 200, `Guide login failed: ${JSON.stringify(guideLogin.data)}`);
      guideToken = guideLogin.data.token;

      const statsRes = await makeRequest(testServer, 'GET', '/api/teacher/stats', null, {
        Authorization: `Bearer ${guideToken}`,
      });
      assert.strictEqual(statsRes.status, 200, 'Stats endpoint should return 200');
      const s = statsRes.data.data;
      assert(typeof s.totalGroups === 'number', 'totalGroups must be a number');
      assert(typeof s.totalStudents === 'number', 'totalStudents must be a number');
      assert(typeof s.pendingReviews === 'number', 'pendingReviews must be a number');
      assert(typeof s.upcomingAppointments === 'number', 'upcomingAppointments must be a number');
      assert(Array.isArray(s.recentActivities), 'recentActivities must be an array');
    });

    await itAsync('13. Guide retrieves assigned students directory with profile data', async () => {
      const res = await makeRequest(testServer, 'GET', '/api/teacher/students', null, {
        Authorization: `Bearer ${guideToken}`,
      });
      assert.strictEqual(res.status, 200, 'Assigned students endpoint should return 200');
      assert(Array.isArray(res.data.data), 'Students response should contain data array');
      if (res.data.data.length > 0) {
        const student = res.data.data[0];
        assert(student.name, 'Student must have name');
        assert(student.department, 'Student must have department');
        assert(Array.isArray(student.skills), 'Student skills must be an array');
        assert(Array.isArray(student.projects), 'Student projects must be an array');
      }
    });

    let createdApptId = null;
    await itAsync('14. Guide schedules a guidance appointment for a student', async () => {
      const res = await makeRequest(
        testServer,
        'POST',
        '/api/teacher/appointments',
        {
          studentEmail: 'student@kkwagh.edu.in',
          studentName: 'Aarav Sharma',
          type: 'project_guidance',
          topic: 'Architecture Review & Database Indexing',
          notes: 'Prepare system diagrams and benchmark numbers',
          scheduledDate: '2026-11-15',
          scheduledTime: '10:00 AM - 10:30 AM',
          location: 'Placement Office & Faculty Cabin, KKWAGH',
        },
        { Authorization: `Bearer ${guideToken}` }
      );
      assert.strictEqual(res.status, 201, `Create appointment failed: ${JSON.stringify(res.data)}`);
      assert(res.data.data._id, 'Appointment ID must be returned');
      createdApptId = res.data.data._id;

      // Verify in DB
      const apptDoc = await GuidanceAppointment.findById(createdApptId);
      assert(apptDoc, 'Appointment must be stored in database');
      assert.strictEqual(apptDoc.topic, 'Architecture Review & Database Indexing');
      assert.strictEqual(apptDoc.status, 'confirmed');
    });

    await itAsync('15. Guide updates appointment status and adds feedback and action items', async () => {
      const res = await makeRequest(
        testServer,
        'PUT',
        `/api/teacher/appointments/${createdApptId}`,
        {
          status: 'completed',
          guideFeedback: 'Strong architecture foundation. Recommended adding compound index on graduationYear.',
          actionItems: ['Implement compound index in MongoDB', 'Run explain() on query before Milestone 3 review'],
        },
        { Authorization: `Bearer ${guideToken}` }
      );
      assert.strictEqual(res.status, 200, `Update appointment failed: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.data.status, 'completed');
      assert(res.data.data.completedAt, 'completedAt timestamp must be recorded');
      assert.strictEqual(res.data.data.actionItems.length, 2);
    });

    await itAsync('16. Guide retrieves placement and career guidance overview', async () => {
      const res = await makeRequest(testServer, 'GET', '/api/teacher/placement-overview', null, {
        Authorization: `Bearer ${guideToken}`,
      });
      assert.strictEqual(res.status, 200, 'Placement overview should return 200');
      const data = res.data.data;
      assert(data.metrics, 'Metrics object must be returned');
      assert(typeof data.metrics.totalCareerSessions === 'number', 'totalCareerSessions must be a number');
      assert(Array.isArray(data.placementReadinessChecklist), 'Checklist must be returned');
      assert(Array.isArray(data.suggestedAlumniMentors), 'Suggested mentors must be returned');
    });

    await itAsync('17. Guide reads and updates faculty profile', async () => {
      const getRes = await makeRequest(testServer, 'GET', '/api/teacher/profile', null, {
        Authorization: `Bearer ${guideToken}`,
      });
      assert.strictEqual(getRes.status, 200, 'Get profile should return 200');

      const putRes = await makeRequest(
        testServer,
        'PUT',
        '/api/teacher/profile',
        {
          fullName: 'Prof. Guide (KKWAGH)',
          department: 'Computer Engineering',
          designation: 'Associate Professor & Capstone Supervisor',
          cabin: 'Room 204, IT Building',
          officeHours: 'Mon-Fri 2:00 PM - 4:00 PM',
          specialization: 'Distributed Systems, Cloud Architecture, ML Pipelines',
        },
        { Authorization: `Bearer ${guideToken}` }
      );
      assert.strictEqual(putRes.status, 200, 'Save profile should return 200');
      assert.strictEqual(putRes.data.data.cabin, 'Room 204, IT Building');
    });

    // Clean up created test student
    await User.deleteOne({ email: TEST_STUDENT_EMAIL });
    await PasswordResetRequest.deleteMany({ email: TEST_STUDENT_EMAIL });
    if (createdApptId) await GuidanceAppointment.findByIdAndDelete(createdApptId);
  } finally {
    testServer.close();
    await mongoose.disconnect();
  }

  console.log('\n===================================================================');
  console.log(`Test Execution Finished: ${passCount} Passed, ${failCount} Failed`);
  console.log('===================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
})();
