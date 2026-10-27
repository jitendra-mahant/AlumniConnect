const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/User');
const Message = require('./models/Message');
const Connection = require('./models/Connection');
const AlumniProfile = require('./models/AlumniProfile');
const { notify } = require('./utils/notify');

let io = null;
const onlineUsers = new Map(); // userId string -> connection count

/**
 * Validates whether two users are permitted to exchange direct messages.
 */
async function canMessage(sender, recipient) {
  if (!sender || !recipient) return false;
  if (sender.role === 'admin' || recipient.role === 'admin') return false;

  // Teacher <-> Student communication (project guidance & PBL mentoring)
  if (
    (sender.role === 'teacher' && recipient.role === 'student') ||
    (sender.role === 'student' && recipient.role === 'teacher')
  ) {
    return true;
  }

  // Accepted connection always allows messaging
  const connected = await Connection.exists({
    status: 'accepted',
    $or: [
      { requester: sender._id, recipient: recipient._id },
      { requester: recipient._id, recipient: sender._id },
    ],
  });
  if (connected) return true;

  // Reply permitted if previous message exists
  if (await Message.exists({ sender: recipient._id, recipient: sender._id })) return true;

  // Student messaging verified alumnus who opted into student questions
  if (sender.role === 'student' && recipient.role === 'alumni') {
    const profile = await AlumniProfile.findOne({ user: recipient._id }).select('availableForStudentQuestions verificationStatus');
    return !!profile && profile.verificationStatus === 'verified' && profile.availableForStudentQuestions;
  }

  return false;
}

function initSocket(httpServer) {
  const configuredOrigins = (env.clientUrl || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const isSocketOriginAllowed = (origin) => {
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

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isSocketOriginAllowed(origin));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // JWT Authentication handshake middleware
  io.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      const token = rawToken?.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select('_id name email role status');

      if (!user) {
        return next(new Error('User does not exist'));
      }

      if (user.status === 'suspended') {
        return next(new Error('User account has been suspended'));
      }

      socket.user = user;
      next();
    } catch (_err) {
      next(new Error('Authentication failed: invalid or expired session token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);

    // Join isolated user room for private notifications and updates
    socket.join(`user:${userId}`);

    // Track presence
    const prevCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, prevCount + 1);
    io.emit('presence:update', { userId, status: 'online' });

    // Client requests current online list
    socket.on('get_online_users', (callback) => {
      if (typeof callback === 'function') {
        callback(Array.from(onlineUsers.keys()));
      }
    });

    // Join private 1:1 conversation room with participant verification
    socket.on('join_conversation', ({ conversationId }) => {
      if (!conversationId || typeof conversationId !== 'string') return;

      // Verify that this user is actually part of this deterministic conversation key
      const parts = conversationId.split('_');
      if (!parts.includes(userId)) {
        socket.emit('error', { message: 'Unauthorized conversation access' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Live send message via socket
    socket.on('send_message', async ({ recipientId, text }, callback) => {
      try {
        if (!recipientId || !text || !String(text).trim()) {
          if (typeof callback === 'function') callback({ error: 'Recipient and message text are required' });
          return;
        }

        const recipient = await User.findById(recipientId);
        if (!recipient || recipient.status !== 'active') {
          if (typeof callback === 'function') callback({ error: 'Recipient not found or inactive' });
          return;
        }

        const allowed = await canMessage(socket.user, recipient);
        if (!allowed) {
          if (typeof callback === 'function') {
            callback({ error: 'Messaging not permitted between these accounts without a connection.' });
          }
          return;
        }

        const conversationId = Message.makeConversationId(socket.user._id, recipient._id);
        const message = await Message.create({
          conversationId,
          sender: socket.user._id,
          recipient: recipient._id,
          text: String(text).trim(),
        });

        // Broadcast to conversation room and to both user rooms
        io.to(`conversation:${conversationId}`).emit('new_message', message);
        io.to(`user:${String(recipient._id)}`).emit('new_message_alert', {
          conversationId,
          message,
          sender: { _id: socket.user._id, name: socket.user.name },
        });

        // Trigger notification
        await notify(recipient._id, {
          type: 'message',
          title: `New message from ${socket.user.name}`,
          body: String(text).slice(0, 100),
          link: `/messages?with=${socket.user._id}`,
        });

        if (typeof callback === 'function') {
          callback({ success: true, data: message });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ error: err.message || 'Failed to deliver message' });
        }
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      if (conversationId && conversationId.includes(userId)) {
        socket.to(`conversation:${conversationId}`).emit('typing:status', {
          conversationId,
          userId,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (conversationId && conversationId.includes(userId)) {
        socket.to(`conversation:${conversationId}`).emit('typing:status', {
          conversationId,
          userId,
          isTyping: false,
        });
      }
    });

    socket.on('disconnect', () => {
      const count = onlineUsers.get(userId) || 1;
      if (count <= 1) {
        onlineUsers.delete(userId);
        io.emit('presence:update', { userId, status: 'offline' });
      } else {
        onlineUsers.set(userId, count - 1);
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${String(userId)}`).emit(event, data);
  }
}

function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  isUserOnline,
  canMessage,
};
