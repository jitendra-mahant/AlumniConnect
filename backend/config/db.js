const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[db] MongoDB connection failed: ${err.message}`);
    console.error('[db] Check MONGODB_URI in backend/.env (see README) or run "npm run dev:memory".');
    throw err;
  }
}

module.exports = connectDB;
