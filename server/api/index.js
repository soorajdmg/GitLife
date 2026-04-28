import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Decision } from '../models/Decision.js';
import { Stats } from '../models/Stats.js';
import authRouter from '../routes/auth.js';
import branchesRouter from '../routes/branches.js';
import decisionsRouter from '../routes/decisions.js';
import statsRouter from '../routes/stats.js';
import exploreRouter from '../routes/explore.js';

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/explore', exploreRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Temporary debug endpoint — remove after fixing OAuth
app.get('/api/debug-env', (req, res) => {
  const cid = process.env.GOOGLE_CLIENT_ID || '';
  const csec = process.env.GOOGLE_CLIENT_SECRET || '';
  res.json({
    GOOGLE_CLIENT_ID: cid ? `${cid.slice(0, 12)}...${cid.slice(-6)}` : 'MISSING',
    GOOGLE_CLIENT_SECRET: csec ? `${csec.slice(0, 8)}...${csec.slice(-4)}` : 'MISSING',
    FRONTEND_URL: process.env.FRONTEND_URL || 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'MISSING',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connect to DB once (cached for serverless reuse)
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

// Vercel serverless handler
export default async function handler(req, res) {
  await ensureDB();
  return app(req, res);
}
