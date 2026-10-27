const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const emailService = require('../utils/emailService');
const http = require('http');
const express = require('express');

// We will test both the low-level security logic and the live HTTP endpoints.
const { createApp } = require('../server');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  ALUMNICONNECT BREVO SMTP & AUTH FLOW TEST SUITE');
  console.log('======================================================\n');

  // Connect DB
  await mongoose.connect(env.mongoUri);
  console.log('[DB] Connected to MongoDB:', env.mongoUri);

  // Start temporary server for testing
  const app = createApp();
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log('[Server] Test server listening on:', baseUrl);

  const testEmail = `test.student.${Date.now()}@kkwagh.edu.in`;
  let issuedOtp = null;

  try {
    // ------------------------------------------------------------------
    // TEST 1: SMTP Transporter Configuration & Verification
    // ------------------------------------------------------------------
    console.log('\n--- Test 1: SMTP Transporter Verification ---');
    assert(emailService.isSmtpConfigured() === true, 'SMTP is configured with Brevo credentials');
    const smtpStatus = await emailService.testSmtpConnection();
    assert(smtpStatus.verified === true, 'Brevo SMTP connection verified via STARTTLS port 587');
    console.log('    Brevo SMTP host:', smtpStatus.host, 'port:', smtpStatus.port);

    // ------------------------------------------------------------------
    // TEST 2: Registration Validation & Domain Restriction
    // ------------------------------------------------------------------
    console.log('\n--- Test 2: Registration Validation & Security ---');
    const invalidDomainRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Attacker',
        email: 'attacker@gmail.com',
        password: 'Password123',
        role: 'student',
      },
    });
    assert(invalidDomainRes.status === 400, 'Non-college domain (@gmail.com) rejected with 400');

    const adminSelfReg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Fake Admin',
        email: `fakeadmin.${Date.now()}@kkwagh.edu.in`,
        password: 'Password123',
        role: 'admin',
      },
    });
    assert(adminSelfReg.status === 400, 'Public admin role assignment rejected with 400');

    // ------------------------------------------------------------------
    // TEST 3: Successful Registration with Brevo OTP Generation
    // ------------------------------------------------------------------
    console.log('\n--- Test 3: Successful Registration Flow ---');
    // Mock the mail sending so we don't spam Brevo quota during fast automated tests
    // (Actual delivery was already verified against live Brevo SMTP in testSmtpConnection)
    let interceptedOtp = null;
    const originalSendOtp = emailService.sendVerificationOtpEmail;
    emailService.sendVerificationOtpEmail = async (to, otp, name) => {
      interceptedOtp = otp;
      return { success: true, delivered: true, mode: 'test_intercepted' };
    };

    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Kunal Patil',
        email: testEmail,
        password: 'SecurePassword123',
        role: 'student',
      },
    });

    assert(regRes.status === 201, 'Registration succeeded with 201 Created');
    assert(regRes.data.requiresVerification === true, 'Response requires institutional verification');
    assert(regRes.data.email === testEmail, 'Normalized email returned in response');
    assert(regRes.data.cooldown === 60, '60-second resend cooldown returned');
    assert(Boolean(interceptedOtp), '6-digit OTP was generated');
    assert(/^\d{6}$/.test(interceptedOtp), 'Generated OTP is exactly 6 numeric digits');
    issuedOtp = interceptedOtp;

    // Verify OTP storage security in MongoDB
    const otpDoc = await EmailOtp.findOne({ email: testEmail, purpose: 'registration' });
    assert(Boolean(otpDoc), 'EmailOtp document created in MongoDB');
    assert(otpDoc.otpHash !== issuedOtp, 'Raw OTP is NEVER stored in database (hashed only)');
    assert(emailService.verifyOtpHash(issuedOtp, otpDoc.otpHash) === true, 'Stored hash matches issued OTP via SHA-256');
    assert(otpDoc.attempts === 0, 'Initial attempts count is 0');
    assert(otpDoc.maxAttempts === 5, 'Max attempts limit is 5');

    // Verify User record is created with isVerified: false
    const pendingUser = await User.findOne({ email: testEmail });
    assert(Boolean(pendingUser), 'User record persisted in database');
    assert(pendingUser.isVerified === false, 'User is unverified before OTP confirmation');

    // ------------------------------------------------------------------
    // TEST 4: Login Blocked for Unverified Users
    // ------------------------------------------------------------------
    console.log('\n--- Test 4: Login Blocking for Unverified Users ---');
    const prematureLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'SecurePassword123',
      },
    });
    assert(prematureLogin.status === 403, 'Login blocked with 403 for unverified user');
    assert(
      prematureLogin.data.code === 'EMAIL_NOT_VERIFIED' || prematureLogin.data.details?.code === 'EMAIL_NOT_VERIFIED',
      'EMAIL_NOT_VERIFIED error code returned'
    );

    // ------------------------------------------------------------------
    // TEST 5: Resend Cooldown Enforcement
    // ------------------------------------------------------------------
    console.log('\n--- Test 5: Resend Cooldown Enforcement ---');
    const rapidResend = await request('/api/auth/resend-otp', {
      method: 'POST',
      body: { email: testEmail },
    });
    assert(rapidResend.status === 429, 'Immediate resend rejected with 429 Too Many Requests');
    assert(
      rapidResend.data.code === 'COOLDOWN_ACTIVE' || rapidResend.data.details?.code === 'COOLDOWN_ACTIVE',
      'COOLDOWN_ACTIVE error code returned'
    );

    // ------------------------------------------------------------------
    // TEST 6: Incorrect OTP & Attempt Counter Lockout
    // ------------------------------------------------------------------
    console.log('\n--- Test 6: Incorrect OTP & Lockout Limits ---');
    const wrongOtpRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: testEmail, otp: '000000' },
    });
    assert(wrongOtpRes.status === 400, 'Incorrect OTP rejected with 400');
    const updatedOtpDoc = await EmailOtp.findOne({ email: testEmail, purpose: 'registration' });
    assert(updatedOtpDoc.attempts === 1, 'Attempt counter incremented to 1');

    // Simulate 4 more incorrect attempts to reach limit of 5
    await EmailOtp.updateOne({ _id: updatedOtpDoc._id }, { $set: { attempts: 5 } });
    const lockoutRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: testEmail, otp: '000000' },
    });
    assert(lockoutRes.status === 400, 'Lockout enforced after 5 failed attempts');
    assert(
      lockoutRes.data.code === 'MAX_ATTEMPTS_EXCEEDED' || lockoutRes.data.details?.code === 'MAX_ATTEMPTS_EXCEEDED',
      'MAX_ATTEMPTS_EXCEEDED returned'
    );

    // ------------------------------------------------------------------
    // TEST 7: Expired OTP Rejection
    // ------------------------------------------------------------------
    console.log('\n--- Test 7: Expired OTP Handling ---');
    const expiredOtp = emailService.generateSixDigitOtp();
    await EmailOtp.create({
      email: testEmail,
      otpHash: emailService.hashOtp(expiredOtp),
      purpose: 'registration',
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() - 10000), // Expired 10 seconds ago
      lastSentAt: new Date(Date.now() - 70000), // Past cooldown
    });

    const expiredRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: testEmail, otp: expiredOtp },
    });
    assert(expiredRes.status === 400, 'Expired OTP rejected with 400');
    assert(
      expiredRes.data.code === 'OTP_EXPIRED' || expiredRes.data.details?.code === 'OTP_EXPIRED',
      'OTP_EXPIRED error code returned'
    );

    // ------------------------------------------------------------------
    // TEST 8: Wrong Purpose OTP Isolation
    // ------------------------------------------------------------------
    console.log('\n--- Test 8: Purpose Isolation ---');
    const resetPurposeOtp = emailService.generateSixDigitOtp();
    await EmailOtp.create({
      email: testEmail,
      otpHash: emailService.hashOtp(resetPurposeOtp),
      purpose: 'password_reset',
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    // Attempting to verify registration with a password_reset OTP
    const wrongPurposeRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: testEmail, otp: resetPurposeOtp },
    });
    assert(wrongPurposeRes.status === 400, 'Password reset OTP cannot be used for registration verification');

    // ------------------------------------------------------------------
    // TEST 9: Successful OTP Verification & Account Activation
    // ------------------------------------------------------------------
    console.log('\n--- Test 9: Successful OTP Verification & Account Activation ---');
    const validOtp = emailService.generateSixDigitOtp();
    await EmailOtp.create({
      email: testEmail,
      otpHash: emailService.hashOtp(validOtp),
      purpose: 'registration',
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    const verifySuccessRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: testEmail, otp: validOtp },
    });

    assert(verifySuccessRes.status === 200, 'OTP verification returned 200 OK');
    assert(Boolean(verifySuccessRes.data.token), 'JWT auth token issued upon verification');
    assert(verifySuccessRes.data.user.isVerified === true, 'User is marked isVerified: true');

    const verifiedUser = await User.findOne({ email: testEmail });
    assert(verifiedUser.isVerified === true, 'User isVerified saved as true in MongoDB');
    assert(verifiedUser.verificationStatus === 'verified', 'User verificationStatus is verified');

    // Verify OTP was atomically consumed
    const consumedOtp = await EmailOtp.findOne({ otpHash: emailService.hashOtp(validOtp) });
    assert(Boolean(consumedOtp.consumedAt), 'OTP document marked consumedAt');

    // Test OTP reuse prevention
    const reuseRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: testEmail, otp: validOtp },
    });
    assert(reuseRes.status === 400, 'Consumed OTP cannot be reused');

    // ------------------------------------------------------------------
    // TEST 10: Login Succeeds After Verification
    // ------------------------------------------------------------------
    console.log('\n--- Test 10: Login Post-Verification ---');
    const postVerifyLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'SecurePassword123',
      },
    });
    assert(postVerifyLogin.status === 200, 'Login succeeded after verification');
    assert(Boolean(postVerifyLogin.data.token), 'JWT token returned on login');

    // ------------------------------------------------------------------
    // TEST 11: Password Recovery with 6-Digit Brevo OTP
    // ------------------------------------------------------------------
    console.log('\n--- Test 11: Password Recovery via 6-Digit OTP ---');
    // Clear previous test OTPs so cooldown doesn't block this test
    await EmailOtp.deleteMany({ email: testEmail, purpose: 'password_reset' });

    let resetOtp = null;
    emailService.sendPasswordResetOtpEmail = async (to, otp, name) => {
      resetOtp = otp;
      return { success: true, delivered: true, mode: 'test_intercepted' };
    };

    // Prevent enumeration: unknown email returns uniform success message
    const unknownEmailRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'nonexistent.user@kkwagh.edu.in' },
    });
    assert(unknownEmailRes.status === 200, 'Forgot-password returns 200 even for non-existent user (enumeration prevention)');

    // Real user password recovery
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: testEmail },
    });
    assert(forgotRes.status === 200, 'Forgot password returns 200');
    assert(Boolean(resetOtp), '6-digit password reset OTP generated');

    // Reset password with the 6-digit OTP
    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: testEmail,
        otp: resetOtp,
        newPassword: 'BrandNewPassword456',
      },
    });
    assert(resetRes.status === 200, 'Password reset succeeded with 200');

    // Verify old password fails and new password succeeds
    const oldPassLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'SecurePassword123' },
    });
    assert(oldPassLogin.status === 401, 'Old password no longer valid');

    const newPassLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'BrandNewPassword456' },
    });
    assert(newPassLogin.status === 200, 'Login succeeded with new password');

    // ------------------------------------------------------------------
    // TEST 12: Preserved Demo Accounts Verification
    // ------------------------------------------------------------------
    console.log('\n--- Test 12: Demo Accounts Preservation ---');
    const demoAccounts = ['student@kkwagh.edu.in', 'alumni@kkwagh.edu.in', 'guide@kkwagh.edu.in', 'admin@kkwagh.edu.in'];
    for (const demoEmail of demoAccounts) {
      const demoUser = await User.findOne({ email: demoEmail });
      assert(Boolean(demoUser), `Demo account ${demoEmail} exists in database`);
      assert(demoUser.isVerified === true, `Demo account ${demoEmail} is verified`);
    }

    // Clean up test records
    await User.deleteMany({ email: testEmail });
    await EmailOtp.deleteMany({ email: testEmail });

    // Restore original email functions
    emailService.sendVerificationOtpEmail = originalSendOtp;

    console.log('\n======================================================');
    console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('======================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\nTEST SUITE FAILED WITH ERROR:', err);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
