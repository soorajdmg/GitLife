import express from 'express';
import { Stats } from '../models/Stats.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get stats for authenticated user
router.get('/', async (req, res) => {
  try {
    const stats = await Stats.get(req.user.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Increment impact for authenticated user
router.post('/increment', async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    const stats = await Stats.incrementImpact(req.user.userId, Number(value));
    res.json(stats);
  } catch (error) {
    console.error('Error incrementing impact:', error);
    res.status(500).json({ error: 'Failed to increment impact' });
  }
});

// Reset stats for authenticated user
router.post('/reset', async (req, res) => {
  try {
    await Stats.reset(req.user.userId);
    const stats = await Stats.get(req.user.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error resetting stats:', error);
    res.status(500).json({ error: 'Failed to reset stats' });
  }
});

export default router;
