import express from 'express';
import { Comment } from '../models/Comment.js';
import { authenticateToken } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';
import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

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

    // Notify asynchronously — don't block the response
    (async () => {
      try {
        const db = getDB();
        const decision = await db.collection('decisions').findOne({ _id: new ObjectId(req.params.id) });
        if (!decision) return;

        if (parentCommentId) {
          // Reply: notify the parent comment's author
          const parentComment = await db.collection('comments').findOne({ _id: new ObjectId(parentCommentId) });
          if (parentComment && parentComment.authorId !== req.user.userId) {
            await Notification.create({
              recipientId: parentComment.authorId,
              senderId: req.user.userId,
              type: 'reply',
              decisionId: req.params.id,
              decisionText: decision.decision,
              commentText: text.trim(),
            });
          }
        } else {
          // Top-level comment: notify the decision owner
          if (decision.userId !== req.user.userId) {
            await Notification.create({
              recipientId: decision.userId,
              senderId: req.user.userId,
              type: 'comment',
              decisionId: req.params.id,
              decisionText: decision.decision,
              commentText: text.trim(),
            });
          }
        }
      } catch {}
    })();

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
