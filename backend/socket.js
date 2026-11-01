const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/User');
const Message = require('./models/Message');
const { canMessage, canOpenDirect, getGroupForUser, isVerified } = require('./services/messageAccess');
const {
  createDirectMessage,
  createGroupMessage,
} = require('./controllers/messageController');

let io = null;
const onlineUsers = new Map(); // userId string -> connection count

function socketErrorMessage(error, fallback) {
  if (error?.name === 'CastError') {
    console.warn('[socket] Invalid database identifier', {
      model: error.model?.modelName,
      path: error.path,
    });
    return 'Invalid identifier.';
  }
  return error?.message || fallback;
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
      const user = await User.findById(decoded.id).select('_id name role status isVerified verificationStatus');

      if (!user) {
        return next(new Error('User does not exist'));
      }
      if (!isVerified(user)) return next(new Error('Account is not authorized for messaging'));

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
    socket.on('join_conversation', async (payload = {}, callback) => {
      try {
        const { conversationId } = payload && typeof payload === 'object' ? payload : {};
        if (typeof conversationId !== 'string' || conversationId.length > 100) {
          throw new Error('Invalid conversation');
        }

        if (conversationId.startsWith('group_')) {
          const groupId = conversationId.slice(6);
          if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error('Invalid conversation');
          if (!(await getGroupForUser(socket.user, groupId))) {
            throw new Error('Unauthorized project group access');
          }
        } else {
          const participantIds = conversationId.split('_');
          if (
            participantIds.length !== 2 ||
            participantIds.some((id) => !mongoose.Types.ObjectId.isValid(id)) ||
            !participantIds.includes(userId)
          ) {
            throw new Error('Unauthorized conversation access');
          }
          const otherId = participantIds.find((id) => id !== userId);
          const peer = await User.findById(otherId).select('_id name role status isVerified verificationStatus');
          if (!peer || !(await canOpenDirect(socket.user, peer)) ||
              Message.makeConversationId(socket.user._id, peer._id) !== conversationId) {
            throw new Error('Unauthorized conversation access');
          }
        }

        await socket.join(`conversation:${conversationId}`);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ error: socketErrorMessage(err, 'Could not join this conversation.') });
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (payload = {}) => {
      const { conversationId } = payload && typeof payload === 'object' ? payload : {};
      if (typeof conversationId === 'string') {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Live send message via socket
    socket.data.messageTimestamps = [];
    socket.on('send_message', async (payload = {}, callback) => {
      try {
        const { recipientId, groupId, text } = payload && typeof payload === 'object' ? payload : {};
        const now = Date.now();
        socket.data.messageTimestamps = socket.data.messageTimestamps.filter((time) => now - time < 10000);
        if (socket.data.messageTimestamps.length >= 15) {
          throw new Error('You are sending messages too quickly. Please wait a moment.');
        }
        socket.data.messageTimestamps.push(now);
        if (typeof text !== 'string' || !text.trim() || text.trim().length > 2000) {
          throw new Error('Message text must contain 1 to 2000 characters.');
        }
        if (recipientId && groupId) throw new Error('Send to a user or group, not both.');
        let message;
        if (groupId) {
          if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error('Invalid project group');
          message = await createGroupMessage(socket.user, groupId, text.trim());
        } else {
          if (!mongoose.Types.ObjectId.isValid(recipientId)) throw new Error('Recipient is required.');
          const recipient = await User.findById(recipientId)
            .select('_id name role status isVerified verificationStatus');
          if (!recipient || recipient.status !== 'active') throw new Error('Recipient not found or inactive');
          message = await createDirectMessage(socket.user, recipient, text.trim());
        }
        if (typeof callback === 'function') callback({ success: true, data: message });
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ error: socketErrorMessage(err, 'Failed to deliver message.') });
        }
      }
    });

    // Typing indicators
    socket.on('typing_start', (payload = {}) => {
      const { conversationId } = payload && typeof payload === 'object' ? payload : {};
      if (typeof conversationId === 'string' && socket.rooms.has(`conversation:${conversationId}`)) {
        socket.to(`conversation:${conversationId}`).emit('typing:status', {
          conversationId,
          userId,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', (payload = {}) => {
      const { conversationId } = payload && typeof payload === 'object' ? payload : {};
      if (typeof conversationId === 'string' && socket.rooms.has(`conversation:${conversationId}`)) {
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
