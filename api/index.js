import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../server/config/database.js';
import { User } from '../server/models/User.js';
import { Branch } from '../server/models/Branch.js';
import { Decision } from '../server/models/Decision.js';
import { Stats } from '../server/models/Stats.js';
import authRouter from '../server/routes/auth.js';
import branchesRouter from '../server/routes/branches.js';
import decisionsRouter from '../server/routes/decisions.js';
import statsRouter from '../server/routes/stats.js';

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
