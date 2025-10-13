import express from 'express';
import { Branch } from '../models/Branch.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all branches for authenticated user
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.findAll(req.user.userId);
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get a single branch by ID for authenticated user
router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id, req.user.userId);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

// Create a new branch for authenticated user
router.post('/', async (req, res) => {
  try {
    const branch = await Branch.create(req.body, req.user.userId);
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// Update a branch for authenticated user
router.put('/:id', async (req, res) => {
  try {
    const success = await Branch.update(req.params.id, req.user.userId, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    const updatedBranch = await Branch.findById(req.params.id, req.user.userId);
    res.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// Delete a branch for authenticated user
router.delete('/:id', async (req, res) => {
  try {
    const success = await Branch.delete(req.params.id, req.user.userId);
    if (!success) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

export default router;
