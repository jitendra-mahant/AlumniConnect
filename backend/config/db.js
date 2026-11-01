const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

function getConnectionTarget(uri) {
  try {
    const parsed = new URL(uri);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')) || '(default)';
    return { host: parsed.hostname, databaseName };
  } catch {
    return null;
  }
}

function getErrorType(err) {
  if (err?.code === 18 || err?.codeName === 'AuthenticationFailed') return 'authentication';
  if (err?.name === 'MongoParseError' || err?.name === 'MongoInvalidArgumentError') return 'configuration';
  return 'network';
}

async function connectDB(uri = env.mongoUri) {
  if (typeof uri !== 'string' || !uri.trim()) {
    console.error('[DB] MongoDB connection failed');
    console.error('[DB] Error type: configuration (MONGODB_URI is missing)');
    console.error('[DB] Server will not start because the database is required');
    throw new Error('MONGODB_URI is required to connect to MongoDB.');
  }

  const target = getConnectionTarget(uri);
  console.log('[DB] Connecting to MongoDB...');
  if (target) {
    console.log(`[DB] Target host: ${target.host}`);
    console.log(`[DB] Target database: ${target.databaseName}`);
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('[DB] Connection successful');
    console.log(`[DB] Host: ${conn.connection.host}`);
    console.log(`[DB] Database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('[DB] MongoDB connection failed');
    console.error(`[DB] Error type: ${getErrorType(err)}`);
    console.error('[DB] Server will not start because the database is required');
    throw err;
  }
}

module.exports = connectDB;
