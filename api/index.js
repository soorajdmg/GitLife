import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../server/config/database.js';
import { User } from '../server/models/User.js';
import { Branch } from '../server/models/Branch.js';
import { Decision } from '../server/models/Decision.js';
import { Stats } from '../server/models/Stats.js';
import { Message } from '../server/models/Message.js';
import { Conversation } from '../server/models/Conversation.js';
import { Notification } from '../server/models/Notification.js';
import { Comment } from '../server/models/Comment.js';
import { Stash } from '../server/models/Stash.js';
import authRouter from '../server/routes/auth.js';
import branchesRouter from '../server/routes/branches.js';
import decisionsRouter from '../server/routes/decisions.js';
import statsRouter from '../server/routes/stats.js';
import exploreRouter from '../server/routes/explore.js';
import messagesRouter from '../server/routes/messages.js';
import notificationsRouter from '../server/routes/notifications.js';
import commentsRouter from '../server/routes/comments.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/explore', exploreRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/comments', commentsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

let isConnected = false;
const ensureDB = async () => {
  if (!isConnected) {
    await connectDB();
    await User.createIndexes();
    await Branch.createIndexes();
    await Decision.createIndexes();
    await Stats.createIndexes();
    isConnected = true;
  }
};

export default async function handler(req, res) {
  await ensureDB();
  return app(req, res);
}
