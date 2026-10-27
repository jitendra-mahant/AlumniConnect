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

  // Safe CORS configuration supporting multiple origins, Vercel deployments, and local dev
  const configuredOrigins = (env.clientUrl || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const norm = origin.trim().replace(/\/+$/, '');
    if (configuredOrigins.includes(norm)) {
      return true;
    }
    // Allow any Vercel production or preview deployment (*.vercel.app)
    if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/i.test(norm)) {
      return true;
    }
    // Allow Render deployment origins (*.onrender.com)
    if (/^https:\/\/([a-zA-Z0-9-]+\.)*onrender\.com$/i.test(norm)) {
      return true;
    }
    // Allow localhost / 127.0.0.1 on any dev port
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(norm)) {
      return true;
    }
    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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
  app.use('/api/auth/resend-verification', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);
  app.use('/api/auth/reset-password', authLimiter);

  const healthHandler = (_req, res) =>
    res.json({ success: true, status: 'ok', college: env.collegeName });
  app.get('/', healthHandler);
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

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
  app.use('/api/teacher', require('./routes/teacherRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api', require('./routes/miscRoutes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const http = require('http');
const { bootstrapPrimaryAdmin } = require('./config/bootstrap');
const { initSocket } = require('./socket');

async function start() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.port, () =>
    console.log(`[server] AlumniConnect API and Real-Time Server running on http://localhost:${env.port}`)
  );

  // Synchronize bootstrap accounts and legacy datasets asynchronously in background
  bootstrapPrimaryAdmin().catch((err) => {
    console.warn('[server] Non-fatal background bootstrap error:', err.message);
  });

  return { app, server };
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[server] Fatal start error:', err.message);
    process.exit(1);
  });
}

module.exports = { createApp, start };
