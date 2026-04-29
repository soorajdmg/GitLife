import express from 'express';
import { Decision } from '../models/Decision.js';
import { Stats } from '../models/Stats.js';
import { Stash } from '../models/Stash.js';
import { authenticateToken } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';
import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all decisions for graph rendering (must be before /:id route)
router.get('/graph', async (req, res) => {
  try {
    const decisions = await Decision.findForGraph(req.user.userId);
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching graph data:', error);
    res.status(500).json({ error: 'Failed to fetch graph data' });
  }
});

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

// Get current user's stashed decision IDs (must be before /:id route)
router.get('/stashes/ids', async (req, res) => {
  try {
    const ids = await Stash.getStashedIds(req.user.userId);
    res.json(ids);
  } catch (error) {
    console.error('Error fetching stash ids:', error);
    res.status(500).json({ error: 'Failed to fetch stashes' });
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

// Toggle reaction on a decision
router.post('/:id/react', async (req, res) => {
  try {
    const { type } = req.body;
    if (!['fork', 'merge', 'support'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }
    const result = await Decision.toggleReaction(req.params.id, req.user.userId, type);
    if (!result) return res.status(404).json({ error: 'Decision not found' });

    // Notify the decision owner when a reaction is added (not removed)
    if (result.reacted) {
      try {
        const db = getDB();
        const decision = await db.collection('decisions').findOne({ _id: new ObjectId(req.params.id) });
        if (decision) {
          Notification.create({
            recipientId: decision.userId,
            senderId: req.user.userId,
            type,
            decisionId: req.params.id,
            decisionText: decision.decision,
          }).catch(() => {});
        }
      } catch {}
    }

    res.json(result);
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});

// Get blame chain (ancestors) for a decision
router.get('/:id/blame-chain', async (req, res) => {
  try {
    const chain = await Decision.getBlameChain(req.params.id, req.user.userId);
    if (!chain) return res.status(404).json({ error: 'Decision not found' });
    res.json(chain);
  } catch (error) {
    console.error('Error fetching blame chain:', error);
    res.status(500).json({ error: 'Failed to fetch blame chain' });
  }
});

// Add/remove causal links on a decision
router.patch('/:id/links', async (req, res) => {
  try {
    const { add = [], remove = [] } = req.body;
    const result = await Decision.updateLinks(req.params.id, req.user.userId, add, remove);
    if (!result) return res.status(404).json({ error: 'Decision not found' });
    res.json(result);
  } catch (error) {
    console.error('Error updating links:', error);
    res.status(500).json({ error: 'Failed to update links' });
  }
});

// Set blame status on a decision
router.patch('/:id/blame', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['broken', 'investigating', 'resolved', null];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid blame status' });
    }
    const result = await Decision.setBlameStatus(req.params.id, req.user.userId, status, note);
    if (!result) return res.status(404).json({ error: 'Decision not found' });
    res.json(result);
  } catch (error) {
    console.error('Error setting blame status:', error);
    res.status(500).json({ error: 'Failed to set blame status' });
  }
});

// Toggle stash on a decision
router.post('/:id/stash', async (req, res) => {
  try {
    const result = await Stash.toggle(req.user.userId, req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error toggling stash:', error);
    res.status(500).json({ error: 'Failed to toggle stash' });
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
