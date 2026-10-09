const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // Safe CORS
  app.use(
    cors({
      origin: env.clientUrl.split(',').map((s) => s.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parser & NoSQL Injection Sanitization
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());

  // Rate Limiting
  const isTest = process.env.NODE_ENV === 'test';
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 2000 : 60,
    message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 1000,
    message: { success: false, message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', college: env.collegeName }));

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/alumni', require('./routes/alumniRoutes'));
  app.use('/api/students', require('./routes/studentRoutes'));
  app.use('/api/connections', require('./routes/connectionRoutes'));
  app.use('/api/mentorship', require('./routes/mentorshipRoutes'));
  app.use('/api/referrals', require('./routes/referralRoutes'));
  app.use('/api/jobs', require('./routes/jobRoutes'));
  app.use('/api/qa', require('./routes/qaRoutes'));
  app.use('/api/messages', require('./routes/messageRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api', require('./routes/miscRoutes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function start() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => console.log(`[server] AlumniConnect API running on http://localhost:${env.port}`));
}

if (require.main === module) {
  start().catch(() => process.exit(1));
}

module.exports = { createApp, start };
