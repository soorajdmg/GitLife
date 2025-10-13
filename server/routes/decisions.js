import express from 'express';
import { Decision } from '../models/Decision.js';
import { Stats } from '../models/Stats.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get total decision count (must be before /:id route)
router.get('/count/total', async (req, res) => {
  try {
    const count = await Decision.count(req.user.userId);
    res.json({ count });
  } catch (error) {
    console.error('Error counting decisions:', error);
    res.status(500).json({ error: 'Failed to count decisions' });
  }
});

// Get decisions by branch (must be before /:id route)
router.get('/branch/:branchName', async (req, res) => {
  try {
    const decisions = await Decision.findByBranch(req.params.branchName, req.user.userId);
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching decisions by branch:', error);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

// Get all decisions for authenticated user
router.get('/', async (req, res) => {
  try {
    const { limit, sortBy, sortOrder } = req.query;
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      sortBy: sortBy || 'timestamp',
      sortOrder: sortOrder === 'asc' ? 1 : -1
    };
    const decisions = await Decision.findAll(req.user.userId, options);
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

// Get a single decision by ID for authenticated user
router.get('/:id', async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id, req.user.userId);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    res.json(decision);
  } catch (error) {
    console.error('Error fetching decision:', error);
    res.status(500).json({ error: 'Failed to fetch decision' });
  }
});

// Create a new decision for authenticated user
router.post('/', async (req, res) => {
  try {
    const decision = await Decision.create(req.body, req.user.userId);

    // Update stats with impact
    if (req.body.impact) {
      await Stats.incrementImpact(req.user.userId, Number(req.body.impact));
    }

    res.status(201).json(decision);
  } catch (error) {
    console.error('Error creating decision:', error);
    res.status(500).json({ error: 'Failed to create decision' });
  }
});

// Delete a decision for authenticated user
router.delete('/:id', async (req, res) => {
  try {
    const success = await Decision.delete(req.params.id, req.user.userId);
    if (!success) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    res.json({ message: 'Decision deleted successfully' });
  } catch (error) {
    console.error('Error deleting decision:', error);
    res.status(500).json({ error: 'Failed to delete decision' });
  }
});

export default router;
