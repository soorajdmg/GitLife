import express from 'express';
import { Notification } from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET /notifications — list notifications for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id?.toString();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const notifs = await Notification.findByRecipient(userId, { limit });
    res.json(notifs);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id?.toString();
    const count = await Notification.countUnread(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

// POST /notifications/:id/read — mark one as read
router.post('/:id/read', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id?.toString();
    await Notification.markRead(req.params.id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

// POST /notifications/read-all — mark all as read
router.post('/read-all', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id?.toString();
    await Notification.markAllRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications read' });
  }
});

export default router;
