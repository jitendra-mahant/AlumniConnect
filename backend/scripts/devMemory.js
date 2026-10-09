/**
 * Zero-install dev mode: starts an embedded MongoDB (mongodb-memory-server),
 * stores data in backend/.mongo-data so it survives restarts, seeds if empty,
 * then boots the API. For real deployments use MONGODB_URI instead.
 */
const path = require('path');
const fs = require('fs');
const net = require('net');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

function isPortOpen(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

(async () => {
  let mongod = null;
  let uri = 'mongodb://127.0.0.1:27018/alumniconnect';

  const running = await isPortOpen(27018);
  if (running) {
    console.log('[dev:memory] Active MongoDB instance detected on port 27018. Connecting to existing database...');
  } else {
    const dbPath = path.join(__dirname, '..', '.mongo-data');
    fs.mkdirSync(dbPath, { recursive: true });
    console.log('[dev:memory] Starting embedded MongoDB on port 27018...');
    mongod = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger', port: 27018 },
    });
    uri = `${mongod.getUri()}alumniconnect`;
  }

  process.env.MONGODB_URI = uri;

  const env = require('../config/env');
  const connectDB = require('../config/db');
  const User = require('../models/User');
  const { seedDatabase } = require('../seed/seed');
  const { createApp } = require('../server');

  await connectDB(uri);
  if ((await User.countDocuments()) === 0) {
    console.log('[dev:memory] Empty database - seeding sample data...');
    await seedDatabase();
  }

  const server = createApp().listen(env.port, () =>
    console.log(`[server] AlumniConnect API running on http://localhost:${env.port}`)
  );

  const shutdown = async () => {
    console.log('\n[dev:memory] Gracefully shutting down...');
    server.close();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('[dev:memory] failed:', err);
  process.exit(1);
});
