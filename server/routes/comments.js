import express from 'express';
import { Comment } from '../models/Comment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true }); // gets :id from parent

router.use(authenticateToken);

// GET /decisions/:id/comments
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.findByDecision(req.params.id, {
      limit: parseInt(req.query.limit) || 50,
    });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /decisions/:id/comments
router.post('/', async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    const comment = await Comment.create({
      decisionId: req.params.id,
      authorId: req.user.userId,
      text: text.trim(),
      parentCommentId: parentCommentId || null,
    });
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// DELETE /decisions/:id/comments/:commentId
router.delete('/:commentId', async (req, res) => {
  try {
    const result = await Comment.delete(req.params.commentId, req.user.userId);
    if (result === null) return res.status(403).json({ error: 'Not your comment' });
    if (!result) return res.status(404).json({ error: 'Comment not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
