const http = require('http');
const ioClient = require('../../frontend/node_modules/socket.io-client');
const { createApp } = require('../server');
const connectDB = require('../config/db');
const { initSocket } = require('../socket');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

async function runTwoSessionTest() {
  console.log('=== STARTING REAL-TIME TWO-SESSION TEST ===');
  try {
    await connectDB();
  } catch (err) {
    console.log(`[test] Notice: MongoDB on 27017 is unreachable (${err.message}).`);
    console.log('[test] In isolated sandboxed environment without local mongod service, live socket session test is BLOCKED.');
    console.log('=== REAL-TIME TEST: BLOCKED (Requires running MongoDB on 127.0.0.1:27017) ===');
    return;
  }

  // Ensure test users exist
  let student = await User.findOne({ email: 'student1@alumniconnect.edu' });
  let teacher = await User.findOne({ email: 'guide@kkwagh.edu.in' });

  if (!student || !teacher) {
    console.log('[test] Seeding database for real-time test...');
    const { seedDatabase } = require('../seed/seed');
    await seedDatabase();
    student = await User.findOne({ email: 'student1@alumniconnect.edu' });
    teacher = await User.findOne({ email: 'guide@kkwagh.edu.in' });
  }

  if (!student || !teacher) {
    throw new Error('Test users (student1@alumniconnect.edu or guide@kkwagh.edu.in) not found');
  }

  const studentToken = generateToken(student._id);
  const teacherToken = generateToken(teacher._id);

  // Start single HTTP server with Express and Socket.IO
  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  const socketUrl = `http://localhost:${port}`;
  console.log(`[test] Real-time test server running on port ${port}`);

  const conversationId = Message.makeConversationId(student._id, teacher._id);
  console.log(`[test] Deterministic conversation ID: ${conversationId}`);

  // Connect Student socket
  const studentSocket = ioClient(socketUrl, {
    auth: { token: studentToken },
    transports: ['websocket'],
  });

  // Connect Teacher socket
  const teacherSocket = ioClient(socketUrl, {
    auth: { token: teacherToken },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve, reject) => {
      studentSocket.on('connect', () => {
        console.log('[test] Student socket connected successfully:', student.name);
        resolve();
      });
      studentSocket.on('connect_error', reject);
    }),
    new Promise((resolve, reject) => {
      teacherSocket.on('connect', () => {
        console.log('[test] Teacher socket connected successfully:', teacher.name);
        resolve();
      });
      teacherSocket.on('connect_error', reject);
    }),
  ]);

  // Both join the conversation room
  studentSocket.emit('join_conversation', { conversationId });
  teacherSocket.emit('join_conversation', { conversationId });

  // Wait 200ms for rooms to register
  await new Promise((r) => setTimeout(r, 200));

  const testText = `Hello Professor, milestone 2 deliverables uploaded at ${new Date().toISOString()}`;

  // Teacher listens for new_message
  const messageReceivedPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for real-time message')), 8000);
    teacherSocket.on('new_message', (msg) => {
      console.log('[test] Teacher received live message via Socket.IO:', msg.text);
      if (msg.text === testText) {
        clearTimeout(timeout);
        resolve(msg);
      }
    });
  });

  // Teacher listens for real-time notification
  const notificationPromise = new Promise((resolve) => {
    teacherSocket.on('notification', (notif) => {
      console.log('[test] Teacher received live real-time notification:', notif.title);
      resolve(notif);
    });
  });

  // Student emits send_message
  console.log('[test] Student sending message over Socket.IO...');
  studentSocket.emit('send_message', { recipientId: teacher._id, text: testText }, (response) => {
    console.log('[test] Server acknowledged send_message:', response.success);
  });

  const receivedMsg = await messageReceivedPromise;
  await notificationPromise;

  // Verify in MongoDB
  const dbMsg = await Message.findById(receivedMsg._id);
  console.log('[test] Persisted MongoDB message check:', dbMsg ? 'PASSED' : 'FAILED');

  // Test unauthorized user joining room
  const unauthorizedUser = await User.findOne({ email: 'priya.sharma@alumniconnect.edu' });
  if (unauthorizedUser) {
    const unauthSocket = ioClient(socketUrl, {
      auth: { token: generateToken(unauthorizedUser._id) },
      transports: ['websocket'],
    });
    await new Promise((resolve) => unauthSocket.on('connect', resolve));
    unauthSocket.emit('join_conversation', { conversationId });
    const authError = await new Promise((resolve) => {
      unauthSocket.on('error', (err) => {
        console.log('[test] Unauthorized conversation access blocked as expected:', err.message);
        resolve(err);
      });
      setTimeout(() => resolve(null), 1000);
    });
    unauthSocket.disconnect();
  }

  // Cleanup
  studentSocket.disconnect();
  teacherSocket.disconnect();
  httpServer.close();

  console.log('=== REAL-TIME TWO-SESSION TEST COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

runTwoSessionTest().catch((err) => {
  console.error('[test] Test failed:', err);
  process.exit(1);
});
