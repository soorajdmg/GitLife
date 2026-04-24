import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './config/database.js';
import { User } from './models/User.js';
import { Branch } from './models/Branch.js';
import { Decision } from './models/Decision.js';
import { Stats } from './models/Stats.js';
import authRouter from './routes/auth.js';
import branchesRouter from './routes/branches.js';
import decisionsRouter from './routes/decisions.js';
import statsRouter from './routes/stats.js';

dotenv.config();

const app = express();
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database indexes
const initializeDatabase = async () => {
  try {
    console.log('Creating database indexes...');
    await User.createIndexes();
    await Branch.createIndexes();
    await Decision.createIndexes();
    await Stats.createIndexes();
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
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
