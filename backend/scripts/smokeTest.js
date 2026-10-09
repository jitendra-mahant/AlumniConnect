/**
 * End-to-end API smoke test suite.
 * Automatically reseeds database before execution for clean, deterministic results.
 * Usage: npm run test:smoke
 */
const net = require('net');
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const { seedDatabase } = require('../seed/seed');

const BASE = process.env.API_URL || 'http://localhost:5000/api';
let failures = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try {
    json = await res.json();
  } catch (_) {
    /* empty */
  }
  return { status: res.status, ...json };
}

function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

const login = async (email, password = 'Password@123') =>
  await call('POST', '/auth/login', { body: { email, password } });

const isPortOpen = (port, host = '127.0.0.1', timeout = 500) =>
  new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(timeout);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.connect(port, host);
  });

(async () => {
  console.log('--- Initializing Clean Test Database ---');
  try {
    const port27018 = await isPortOpen(27018);
    const uri = process.env.MONGODB_URI || (port27018 ? 'mongodb://127.0.0.1:27018/alumniconnect' : env.mongoUri);
    await connectDB(uri);
    await seedDatabase({ log: () => {} });
    console.log('Database successfully reseeded for test run.\n');
  } catch (err) {
    console.warn('Could not reseed directly (running against live DB):', err.message);
  }

  // Force running server to refresh in-memory Trie & Hash Map
  const initAdmin = await login('admin@alumniconnect.edu', 'Admin@123');
  await call('POST', '/admin/reindex', { token: initAdmin.token });

  // 1. Authentication & Security
  console.log('1. Authentication & Security');
  const bad = await login('student1@alumniconnect.edu', 'wrong');
  check('wrong password -> 401', bad.status === 401);

  const s = await login('student1@alumniconnect.edu');
  check('student login -> 200', s.status === 200 && s.token);

  const me = await call('GET', '/auth/me', { token: s.token });
  check('GET /auth/me returns student profile', me.user?.role === 'student' && me.profile?.fullName === 'Aarav Mehta');

  check('unauthenticated request -> 401', (await call('GET', '/alumni')).status === 401);

  const regAdmin = await call('POST', '/auth/register', {
    body: { name: 'Temp', email: `t${Date.now()}@x.edu`, password: 'secret12', role: 'admin' },
  });
  check('cannot self-register as admin -> 400', regAdmin.status === 400);

  const weakPass = await call('POST', '/auth/register', {
    body: { name: 'Temp', email: `t${Date.now()}@x.edu`, password: '123', role: 'student' },
  });
  check('short password (<6 chars) rejected -> 400', weakPass.status === 400);

  // URL protocol validation test
  const badUrlProfile = await call('PUT', '/students/profile', {
    token: s.token,
    body: { fullName: 'Aarav Mehta', linkedinUrl: 'javascript:alert(1)' },
  });
  check('malicious URL scheme rejected -> 400', badUrlProfile.status === 400);

  // 2. Alumni Directory & Search
  console.log('\n2. Alumni Directory & Search');
  const all = await call('GET', '/alumni?limit=50', { token: s.token });
  check('directory lists only verified (12)', all.total === 12, `got ${all.total}`);
  check('contact details (email/phone) masked for unconnected', !all.data.some((a) => a.email));

  const react = await call('GET', '/alumni/search?skill=React', { token: s.token });
  check('skill=React returns matching alumni', react.total >= 4 && react.data.every((a) => [...a.skills, ...a.technologies].some((x) => /react/i.test(x))));

  const tcs = await call('GET', '/alumni/search?company=TCS', { token: s.token });
  check('company=TCS returns exact matches', tcs.total === 2 && tcs.data.every((a) => a.currentCompany === 'TCS'));

  const nl = await call('GET', '/alumni/search?q=' + encodeURIComponent('Alumni working at TCS'), { token: s.token });
  check('natural language q="Alumni working at TCS"', nl.total === 2);

  const se = await call('GET', '/alumni/search?q=' + encodeURIComponent('Software Engineering'), { token: s.token });
  check('q="Software Engineering" matches roles and domain', se.total >= 5);

  const mentor = await call('GET', '/alumni/search?availableForMentorship=true&limit=50', { token: s.token });
  check('availableForMentorship=true filter', mentor.total > 0 && mentor.data.every((a) => a.availableForMentorship));

  const sug = await call('GET', '/alumni/suggest?q=rea', { token: s.token });
  check('Trie autocomplete suggests "React"', sug.data.some((x) => x.label === 'React'));

  // 3. Personalized Recommendations
  console.log('\n3. Personalized Recommendations');
  const recs = await call('GET', '/alumni/recommendations', { token: s.token });
  check('GET /alumni/recommendations returns items', recs.status === 200 && recs.data.length > 0);
  check('recommendation has matchReasons & matchScore', recs.data[0].matchScore > 0 && recs.data[0].matchReasons.length > 0);

  // 4. Alumni Q&A Forum
  console.log('\n4. Alumni Q&A Forum');
  const qaList = await call('GET', '/qa/questions', { token: s.token });
  check('GET /qa/questions lists seeded questions', qaList.status === 200 && qaList.total >= 4);

  // Student creates a question
  const newQ = await call('POST', '/qa/questions', {
    token: s.token,
    body: {
      title: 'What are the key differences between SDE and DevOps internships?',
      description: 'I want to know whether a DevOps path helps in moving to backend engineering later.',
      category: 'Career Guidance',
      tags: ['devops', 'backend', 'internship'],
    },
  });
  check('student creates question -> 201', newQ.status === 201 && newQ.data.title.includes('DevOps'));
  const questionId = newQ.data._id;

  // Student tries to post an answer -> 403
  const studentAns = await call('POST', `/qa/questions/${questionId}/answers`, {
    token: s.token,
    body: { body: 'Students should not be allowed to post primary answers here.' },
  });
  check('student blocked from answering -> 403', studentAns.status === 403, `got ${studentAns.status}: ${JSON.stringify(studentAns)}`);

  // Verified alumni posts an answer -> 201
  const alum = await login('priya.sharma@alumniconnect.edu');
  const alumAns = await call('POST', `/qa/questions/${questionId}/answers`, {
    token: alum.token,
    body: { body: 'DevOps gives great exposure to Linux, CI/CD, and cloud infrastructure which makes you a stronger backend engineer!' },
  });
  check('verified alumni posts answer -> 201', alumAns.status === 201 && alumAns.data?.body?.includes('DevOps'), `got ${alumAns.status}: ${JSON.stringify(alumAns)}`);
  const answerId = alumAns.data?._id;

  // Toggle upvote on answer
  const upvote1 = await call('POST', `/qa/answers/${answerId}/upvote`, { token: s.token });
  check('student upvotes answer -> upvoted: true, count: 1', upvote1.status === 200 && upvote1.data.upvoted === true && upvote1.data.upvotesCount === 1);
  const upvote2 = await call('POST', `/qa/answers/${answerId}/upvote`, { token: s.token });
  check('toggle upvote removes vote -> upvoted: false, count: 0', upvote2.status === 200 && upvote2.data.upvoted === false && upvote2.data.upvotesCount === 0);

  // Add follow-up comment
  const comment = await call('POST', `/qa/answers/${answerId}/comments`, {
    token: s.token,
    body: { body: 'Does Kubernetes experience matter for 3rd year interns?' },
  });
  check('student adds follow-up comment -> 201', comment.status === 201 && comment.data?.body?.includes('Kubernetes'));

  // Another student tries to accept answer -> 403
  const s2 = await login('student2@alumniconnect.edu');
  const nonAuthorAccept = await call('POST', `/qa/answers/${answerId}/accept`, { token: s2.token });
  check('non-author blocked from accepting answer -> 403', nonAuthorAccept.status === 403);

  // Author marks answer as accepted -> 200
  const acceptRes = await call('POST', `/qa/answers/${answerId}/accept`, { token: s.token });
  check('question author marks answer as accepted -> 200', acceptRes.status === 200 && acceptRes.data.isAccepted === true && acceptRes.data.questionStatus === 'answered');

  // Report question
  const reportQ = await call('POST', '/reports', {
    token: s2.token,
    body: { targetType: 'question', targetId: questionId, reason: 'Test moderation reporting' },
  });
  check('create report on question -> 201', reportQ.status === 201);

  // Admin moderates question
  const admin = await login('admin@alumniconnect.edu', 'Admin@123');
  const modQ = await call('PUT', `/qa/questions/${questionId}/moderate`, {
    token: admin.token,
    body: { isHidden: true, moderationNote: 'Under review' },
  });
  check('admin moderates question -> 200', modQ.status === 200 && modQ.data.isHidden === true);

  // Student cannot view hidden question -> 404
  const hiddenView = await call('GET', `/qa/questions/${questionId}`, { token: s2.token });
  check('hidden question invisible to other students -> 404', hiddenView.status === 404);

  // 5. Connections & Messaging
  console.log('\n5. Connections & Messaging');
  const priya = all.data.find((a) => a.fullName === 'Priya Sharma');
  const neha = all.data.find((a) => a.fullName === 'Neha Kulkarni');
  const vik = all.data.find((a) => a.fullName === 'Vikram Singh');

  // Connected alumni contact info visible
  const priyaDetail = await call('GET', `/alumni/${priya._id}`, { token: s.token });
  check('connected alumni contact info is visible', priyaDetail.data.email && priyaDetail.connection?.status === 'accepted');

  // Duplicate connection -> 409
  check('duplicate connection request -> 409', (await call('POST', '/connections', { token: s.token, body: { recipientId: neha.user } })).status === 409);

  // New connection request
  const newConn = await call('POST', '/connections', { token: s.token, body: { recipientId: vik.user, message: 'Hello Vikram' } });
  check('create connection request -> 201', newConn.status === 201);

  const vikLogin = await login('vikram.singh@alumniconnect.edu');
  const acceptConn = await call('PUT', `/connections/${newConn.data._id}`, { token: vikLogin.token, body: { status: 'accepted' } });
  check('recipient accepts connection -> 200', acceptConn.status === 200);

  // BFS degree calculation
  const meAarav = await call('GET', '/auth/me', { token: s.token });
  const bfsPath = await call('GET', `/connections/path/${meAarav.user._id}`, { token: s2.token });
  check('BFS path student2 -> student1 has 2 hops', bfsPath.degrees === 2);

  // Messages between connected users
  const msg = await call('POST', '/messages', { token: s.token, body: { recipientId: priya.user, text: 'Hello Priya' } });
  check('send message between connected users -> 201', msg.status === 201);

  // 6. Mentorship & Referrals
  console.log('\n6. Mentorship & Referrals');
  const karan = all.data.find((a) => a.fullName === 'Karan Malhotra');
  const ment = await call('POST', '/mentorship', { token: s.token, body: { alumniId: karan.user, topic: 'Career Guidance', message: 'Hi Karan' } });
  check('mentorship request -> 201', ment.status === 201);

  const sneha = all.data.find((a) => a.fullName === 'Sneha Iyer');
  check('mentorship blocked when unavailable -> 400', (await call('POST', '/mentorship', { token: s.token, body: { alumniId: sneha.user, topic: 'x', message: 'y' } })).status === 400);

  const ref = await call('POST', '/referrals', { token: s.token, body: { alumniId: sneha.user, role: 'Technology Analyst', message: 'Referral please' } });
  check('referral request -> 201', ref.status === 201);

  // 7. Jobs with DSA Ranking
  console.log('\n7. Jobs with DSA Ranking');
  const jobs = await call('GET', '/jobs', { token: s.token });
  check('jobs ranked for student by priority queue matchScore', jobs.ranked && jobs.data.length > 0 && jobs.data[0].matchScore >= jobs.data[jobs.data.length - 1].matchScore);

  const saved = await call('POST', `/jobs/${jobs.data[0]._id}/save`, { token: s.token });
  check('save job -> true', saved.saved === true);

  check('student cannot post job -> 403', (await call('POST', '/jobs', { token: s.token, body: { title: 'Invalid' } })).status === 403);

  // 8. Admin Moderation & Verification
  console.log('\n8. Admin Moderation & Verification');
  const stats = await call('GET', '/admin/stats', { token: admin.token });
  check('admin stats includes users, jobs, and qa metrics', stats.data.users.total >= 16 && stats.data.qa?.questions >= 4);

  const pendingAlumni = (await call('GET', '/admin/alumni?status=pending', { token: admin.token })).data;
  check('pending alumni profile found', pendingAlumni.length > 0);

  const verifyAlum = await call('PUT', `/admin/alumni/${pendingAlumni[0]._id}/verify`, {
    token: admin.token,
    body: { status: 'verified' },
  });
  check('verify alumni -> verificationStatus: verified', verifyAlum.data.verificationStatus === 'verified');

  const reportsList = await call('GET', '/admin/reports?status=open', { token: admin.token });
  check('admin reports list includes question report', reportsList.data.some((r) => r.targetType === 'question'));

  console.log('\n----------------------------------------');
  if (failures === 0) {
    console.log('ALL API SMOKE CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log(`${failures} CHECK(S) FAILED.`);
  }
  console.log('----------------------------------------');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(failures ? 1 : 0);
})().catch((err) => {
  console.error('[smokeTest] unexpected fatal error:', err);
  process.exit(1);
});
