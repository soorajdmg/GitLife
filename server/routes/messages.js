import express from 'express';
import https from 'https';
import http from 'http';
import { authenticateToken } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

// Fetch URL content with a short timeout for link previews
function fetchUrl(url, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'GitLife-LinkPreview/1.0' } }, (res) => {
      // Follow one redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return fetchUrl(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => { data += chunk; if (data.length > 80000) req.destroy(); });
      res.on('end', () => resolve(data));
    });
    req.setTimeout(timeoutMs, () => req.destroy());
    req.on('error', reject);
  });
}

function extractMeta(html, url) {
  const get = (attr, name) => {
    const m = html.match(new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`, 'i'));
    return m?.[1] || null;
  };
  const title = get('property', 'og:title') || get('name', 'twitter:title')
    || html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() || null;
  const description = get('property', 'og:description') || get('name', 'twitter:description')
    || get('name', 'description') || null;
  let image = get('property', 'og:image') || get('name', 'twitter:image') || null;
  if (image && image.startsWith('/')) {
    try { const u = new URL(url); image = u.origin + image; } catch {}
  }
  return { title, description: description?.slice(0, 200) || null, image };
}

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
    const { text, sharedCommit, replyTo } = req.body;

    if (!text?.trim() && !sharedCommit) return res.status(400).json({ error: 'text required' });

    const [conv, message] = await Promise.all([
      Conversation.findById(id),
      Message.create({
        conversationId: id,
        senderId: req.user.userId,
        text: text?.trim() || '',
        sharedCommit: sharedCommit || null,
        replyTo: replyTo || null,
      }),
    ]);

    if (!conv) {
      Message.deleteById(message.id).catch(() => {});
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (!conv.participants.includes(req.user.userId)) {
      Message.deleteById(message.id).catch(() => {});
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Respond and broadcast immediately
    const io = req.app.get('io');
    if (io) io.to(`conv:${id}`).emit('new_message', { conversationId: id, message });
    res.status(201).json({ message });

    // Update metadata in background
    Conversation.updateLastMessage(id, req.user.userId, text?.trim() || '', conv.participants)
      .catch(err => console.error('updateLastMessage error:', err));
  } catch (err) {
    console.error('POST /messages error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// DELETE /api/messages/conversations/:id — hide conversation from current user's list
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (!conv.participants.includes(req.user.userId)) return res.status(403).json({ error: 'Forbidden' });

    await Conversation.hideForUser(id, req.user.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /conversations error:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
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

// GET /api/messages/conversations/:id/search — search messages by text
router.get('/conversations/:id/search', async (req, res) => {
  try {
    const { id } = req.params;
    const { q, limit = 30 } = req.query;
    if (!q?.trim()) return res.json({ messages: [] });

    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (!conv.participants.includes(req.user.userId)) return res.status(403).json({ error: 'Forbidden' });

    const messages = await Message.searchInConversation(id, q.trim(), Math.min(parseInt(limit), 50));
    res.json({ messages });
  } catch (err) {
    console.error('GET /search error:', err);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// DELETE /api/messages/:msgId — soft-delete a message (sender only)
router.delete('/message/:msgId', async (req, res) => {
  try {
    const { msgId } = req.params;
    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const updated = await Message.softDelete(msgId, req.user.userId);
    const io = req.app.get('io');
    if (io) io.to(`conv:${msg.conversationId}`).emit('message_updated', { message: updated });
    res.json({ message: updated });
  } catch (err) {
    console.error('DELETE /message error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// PATCH /api/messages/:msgId — edit message text (sender only)
router.patch('/message/:msgId', async (req, res) => {
  try {
    const { msgId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text required' });

    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
    if (msg.deletedAt) return res.status(400).json({ error: 'Cannot edit deleted message' });

    // Allow editing within 15 minutes
    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    if (ageMs > 15 * 60 * 1000) return res.status(400).json({ error: 'Edit window expired (15 minutes)' });

    const updated = await Message.editText(msgId, req.user.userId, text.trim());
    if (!updated) return res.status(404).json({ error: 'Message not found' });

    const io = req.app.get('io');
    if (io) io.to(`conv:${msg.conversationId}`).emit('message_updated', { message: updated });
    res.json({ message: updated });
  } catch (err) {
    console.error('PATCH /message error:', err);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// POST /api/messages/:msgId/react — toggle emoji reaction
router.post('/message/:msgId/react', async (req, res) => {
  try {
    const { msgId } = req.params;
    const { emoji } = req.body;
    const ALLOWED = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
    if (!ALLOWED.includes(emoji)) return res.status(400).json({ error: 'Invalid emoji' });

    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Verify user is a participant in that conversation
    const conv = await Conversation.findById(msg.conversationId);
    if (!conv || !conv.participants.includes(req.user.userId)) return res.status(403).json({ error: 'Forbidden' });

    const updated = await Message.toggleReaction(msgId, req.user.userId, emoji);
    if (!updated) return res.status(404).json({ error: 'Message not found' });

    const io = req.app.get('io');
    if (io) io.to(`conv:${msg.conversationId}`).emit('message_updated', { message: updated });
    res.json({ message: updated });
  } catch (err) {
    console.error('POST /react error:', err);
    res.status(500).json({ error: 'Failed to react' });
  }
});

// GET /api/messages/link-preview?url=... — fetch open-graph metadata for a URL
router.get('/link-preview', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });

    // Basic URL validation
    let parsed;
    try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
    if (!['http:', 'https:'].includes(parsed.protocol)) return res.status(400).json({ error: 'Invalid protocol' });

    const html = await fetchUrl(url);
    const meta = extractMeta(html, url);
    res.json({ url, ...meta });
  } catch (err) {
    // Return empty preview on failure — the client shows URL as fallback
    res.json({ url: req.query.url, title: null, description: null, image: null });
  }
});

export default router;
