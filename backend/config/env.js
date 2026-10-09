require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alumniconnect',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  collegeName: process.env.COLLEGE_NAME || 'National Institute of Technology',
};

const crypto = require('crypto');

if (!env.jwtSecret) {
  if (env.nodeEnv === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production and must not be empty.');
  }
  // Generate a cryptographically strong secret for the development session instead of an insecure static string
  env.jwtSecret = crypto.randomBytes(32).toString('hex');
  console.info('[config] Generated cryptographically strong development JWT_SECRET.');
} else if (env.nodeEnv === 'production' && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET in production must be at least 32 characters long for cryptographic security.');
}

module.exports = env;
