import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

const router = express.Router();

// All message routes require auth
router.use(authenticateToken);

// GET /api/messages/conversations — list all conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const convs = await Conversation.findByUser(req.user.userId);

    // Enrich with the other participant's user info
    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const otherId = conv.participants.find(p => p !== req.user.userId);
        const other = otherId ? await User.findById(otherId) : null;
        return {
          ...conv,
          otherUser: other
            ? { id: other.id, username: other.username, fullName: other.fullName, avatarUrl: other.avatarUrl }
            : null,
          unreadCount: conv.unread?.[req.user.userId] || 0,
        };
      })
    );

    res.json({ conversations: enriched });
  } catch (err) {
    console.error('GET /conversations error:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// POST /api/messages/conversations — get or create a conversation with another user
router.post('/conversations', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (userId === req.user.userId) return res.status(400).json({ error: 'Cannot message yourself' });

    const other = await User.findById(userId);
    if (!other) return res.status(404).json({ error: 'User not found' });

    const conv = await Conversation.getOrCreate(req.user.userId, userId);

    res.json({
      conversation: {
        ...conv,
        otherUser: { id: other.id, username: other.username, fullName: other.fullName, avatarUrl: other.avatarUrl },
        unreadCount: conv.unread?.[req.user.userId] || 0,
      },
    });
  } catch (err) {
    console.error('POST /conversations error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/messages/conversations/:id/messages — paginated message history
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    // Verify the user is a participant
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (!conv.participants.includes(req.user.userId)) return res.status(403).json({ error: 'Forbidden' });

    const messages = await Message.findByConversation(id, {
      limit: Math.min(parseInt(limit), 100),
      before,
    });

    // Mark as read
    await Message.markRead(id, req.user.userId);
    await Conversation.markRead(id, req.user.userId);

    res.json({ messages });
  } catch (err) {
    console.error('GET /messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// POST /api/messages/conversations/:id/messages — send a message via REST (fallback)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, sharedCommit } = req.body;

    if (!text?.trim()) return res.status(400).json({ error: 'text required' });

    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (!conv.participants.includes(req.user.userId)) return res.status(403).json({ error: 'Forbidden' });

    const message = await Message.create({
      conversationId: id,
      senderId: req.user.userId,
      text: text.trim(),
      sharedCommit: sharedCommit || null,
    });

    await Conversation.updateLastMessage(id, req.user.userId, text.trim(), conv.participants);

    res.status(201).json({ message });
  } catch (err) {
    console.error('POST /messages error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/messages/conversations/:id/read — mark conversation as read
router.post('/conversations/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (!conv.participants.includes(req.user.userId)) return res.status(403).json({ error: 'Forbidden' });

    await Message.markRead(id, req.user.userId);
    await Conversation.markRead(id, req.user.userId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

export default router;
