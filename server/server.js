import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import jwt from 'jsonwebtoken';
import { connectDB, closeDB } from './config/database.js';
import { User } from './models/User.js';
import { Branch } from './models/Branch.js';
import { Decision } from './models/Decision.js';
import { Stats } from './models/Stats.js';
import { Conversation } from './models/Conversation.js';
import { Message } from './models/Message.js';
import { Comment } from './models/Comment.js';
import { Stash } from './models/Stash.js';
import { Notification } from './models/Notification.js';
import authRouter from './routes/auth.js';
import branchesRouter from './routes/branches.js';
import decisionsRouter from './routes/decisions.js';
import statsRouter from './routes/stats.js';
import exploreRouter from './routes/explore.js';
import messagesRouter from './routes/messages.js';
import commentsRouter from './routes/comments.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/explore', exploreRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/decisions/:id/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Frontend is served by Vercel — no static files here

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ─── Socket.io setup ────────────────────────────────────────────────────────

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track online users: userId → Set of socketIds (multi-tab support)
const onlineUsers = new Map();

function addOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnline(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true; // user went fully offline
  }
  return false;
}

// JWT auth middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  const { userId, username } = socket;
  addOnline(userId, socket.id);

  // Auto-join all of the user's conversation rooms
  try {
    const convs = await Conversation.findByUser(userId);
    convs.forEach(c => socket.join(`conv:${c.id}`));
  } catch (err) {
    console.error('Error joining conversation rooms:', err);
  }

  // Notify others that this user is now online
  socket.broadcast.emit('user_online', { userId });

  // ── Send message ──────────────────────────────────────────────────────────
  socket.on('send_message', async ({ conversationId, text, sharedCommit }, ack) => {
    try {
      if (!text?.trim()) return ack?.({ error: 'Empty message' });

      const conv = await Conversation.findById(conversationId);
      if (!conv || !conv.participants.includes(userId)) {
        return ack?.({ error: 'Forbidden' });
      }

      const message = await Message.create({
        conversationId,
        senderId: userId,
        text: text.trim(),
        sharedCommit: sharedCommit || null,
      });

      await Conversation.updateLastMessage(conversationId, userId, text.trim(), conv.participants);

      // Broadcast to all participants in this conversation room
      io.to(`conv:${conversationId}`).emit('new_message', { conversationId, message });

      ack?.({ ok: true, message });
    } catch (err) {
      console.error('send_message error:', err);
      ack?.({ error: 'Failed to send message' });
    }
  });

  // ── Typing indicators ─────────────────────────────────────────────────────
  socket.on('typing_start', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('typing_start', { conversationId, userId });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('typing_stop', { conversationId, userId });
  });

  // ── Mark messages as read ─────────────────────────────────────────────────
  socket.on('mark_read', async ({ conversationId }) => {
    try {
      await Message.markRead(conversationId, userId);
      await Conversation.markRead(conversationId, userId);
      // Tell the other side their messages were read
      socket.to(`conv:${conversationId}`).emit('messages_read', { conversationId, readBy: userId });
    } catch (err) {
      console.error('mark_read error:', err);
    }
  });

  // ── Join a newly created conversation room ────────────────────────────────
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv:${conversationId}`);
  });

  // ── Query who is online ───────────────────────────────────────────────────
  socket.on('get_online_users', (userIds, ack) => {
    const online = userIds.filter(id => onlineUsers.has(id));
    ack?.(online);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    const wentOffline = removeOnline(userId, socket.id);
    if (wentOffline) {
      // Update lastSeen in users collection
      try {
        await User.update(userId, { lastSeen: new Date().toISOString() });
      } catch {}
      socket.broadcast.emit('user_offline', { userId, lastSeen: new Date().toISOString() });
    }
  });
});

// ─── Database init & server start ───────────────────────────────────────────

const initializeDatabase = async () => {
  try {
    console.log('Creating database indexes...');
    await User.createIndexes();
    await Branch.createIndexes();
    await Decision.createIndexes();
    await Stats.createIndexes();
    await Conversation.createIndexes();
    await Message.createIndexes();
    await Comment.createIndexes();
    await Stash.createIndexes();
    await Notification.createIndexes();
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await initializeDatabase();
    httpServer.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await closeDB();
  process.exit(0);
});

startServer();
