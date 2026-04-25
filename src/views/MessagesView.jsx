import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../config/api';
import BranchPill from '../components/ui/BranchPill';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(str = '') {
  const colors = [
    'oklch(52% 0.2 260)', 'oklch(56% 0.2 330)', 'oklch(50% 0.18 155)',
    'oklch(60% 0.19 55)',  'oklch(52% 0.18 200)', 'oklch(58% 0.18 30)',
  ];
  let hash = 0;
  for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[Math.abs(hash)];
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = diffMs / 60000;
  const diffH = diffMs / 3600000;
  const diffD = diffMs / 86400000;
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${Math.floor(diffMin)}m`;
  if (diffH < 24) return `${Math.floor(diffH)}h`;
  if (diffD < 7) return `${Math.floor(diffD)}d`;
  return d.toLocaleDateString();
}

function fmtMessageTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 40, showOnline = false, isOnline = false }) {
  const ini = getInitials(user?.fullName || user?.username || '?');
  const color = avatarColor(user?.id || '');
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt={ini} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700, color: 'white' }}>{ini}</div>
      }
      {showOnline && (
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: isOnline ? '#22c55e' : '#94a3b8', border: '2px solid white' }} />
      )}
    </div>
  );
}

// ─── New chat modal ───────────────────────────────────────────────────────────

function NewChatModal({ onClose, onStart, currentUserId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // Load suggested users on open
  useEffect(() => {
    api.searchUsers('', 12).then(data => {
      const arr = Array.isArray(data) ? data : (data.users || []);
      setResults(arr.filter(u => u.id !== currentUserId));
    }).catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      // Restore suggested list when query cleared
      api.searchUsers('', 12).then(data => {
        const arr = Array.isArray(data) ? data : (data.users || []);
        setResults(arr.filter(u => u.id !== currentUserId));
      }).catch(() => setResults([]));
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchUsers(query, 10);
        const arr = Array.isArray(data) ? data : (data.users || []);
        setResults(arr.filter(u => u.id !== currentUserId));
      } catch { setResults([]); }
      setLoading(false);
    }, 280);
    return () => clearTimeout(timerRef.current);
  }, [query, currentUserId]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'oklch(20% 0.03 260 / 0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: 'white', borderRadius: 16, width: 400, maxHeight: 520, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 48px oklch(25% 0.05 260 / 0.18), 0 1px 3px oklch(25% 0.05 260 / 0.08)', border: '1px solid oklch(91% 0.006 80)' }}>

        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid oklch(93% 0.004 80)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'oklch(18% 0.015 260)' }}>New message</div>
          <button onClick={onClose}
            style={{ border: 'none', background: 'oklch(95% 0.006 80)', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(48% 0.01 260)', fontSize: 14, lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid oklch(94% 0.004 80)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(97.5% 0.006 260)', border: '1px solid oklch(90% 0.008 260)', borderRadius: 10, padding: '8px 12px', transition: 'border 0.12s' }}
            onFocusCapture={e => e.currentTarget.style.border = '1px solid oklch(72% 0.12 260)'}
            onBlurCapture={e => e.currentTarget.style.border = '1px solid oklch(90% 0.008 260)'}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="oklch(58% 0.01 260)" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="12.5" y2="12.5" /></svg>
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or @username…"
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(18% 0.015 260)' }}
            />
            {query && (
              <button onClick={() => setQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'oklch(60% 0.01 260)', fontSize: 13, lineHeight: 1 }}>✕</button>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!query.trim() && results.length > 0 && (
            <div style={{ padding: '8px 18px 4px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)' }}>
              Suggested
            </div>
          )}
          {loading && (
            <div style={{ padding: '20px 18px', fontSize: 13, color: 'oklch(60% 0.01 260)', textAlign: 'center' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <div style={{ padding: '28px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(35% 0.01 260)', marginBottom: 4 }}>No users found</div>
              <div style={{ fontSize: 12, color: 'oklch(60% 0.01 260)' }}>Try a different name or username</div>
            </div>
          )}
          {!loading && results.map(u => (
            <div
              key={u.id}
              onClick={() => onStart(u)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', borderBottom: '1px solid oklch(96.5% 0.003 80)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'oklch(96.5% 0.01 260)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <Avatar user={u} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'oklch(18% 0.015 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName || u.username}</div>
                <div style={{ fontSize: 11.5, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace" }}>@{u.username}</div>
              </div>
              <div style={{ fontSize: 11, color: 'oklch(62% 0.01 260)', flexShrink: 0 }}>
                {u.commitCount > 0 && `${u.commitCount} commits`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message bubble group ─────────────────────────────────────────────────────

function MessageGroup({ group, isMe, readByOther }) {
  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
      {!isMe && (
        <Avatar user={group.senderUser} size={28} />
      )}
      <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {group.messages.map((msg, mi) => (
          <div key={msg.id}>
            {msg.sharedCommit && (
              <div style={{ background: 'white', border: '1px solid oklch(88% 0.008 260)', borderRadius: 10, padding: '10px 12px', marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: 'oklch(58% 0.01 260)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⎇</span> Shared commit
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4, color: 'oklch(18% 0.015 260)' }}>{msg.sharedCommit.message}</div>
                <BranchPill name={msg.sharedCommit.branch} wi={false} merged={false} />
              </div>
            )}
            <div style={{
              padding: '9px 14px',
              borderRadius: (() => {
                const only = group.messages.length === 1, first = mi === 0, last = mi === group.messages.length - 1;
                if (only) return '14px';
                if (isMe) {
                  if (first) return '14px 14px 4px 14px';
                  if (last) return '14px 4px 14px 14px';
                  return '14px 4px 4px 14px';
                } else {
                  if (first) return '14px 14px 14px 4px';
                  if (last) return '4px 14px 14px 14px';
                  return '4px 14px 14px 4px';
                }
              })(),
              background: isMe ? 'oklch(52% 0.2 260)' : 'white',
              color: isMe ? 'white' : 'oklch(18% 0.015 260)',
              fontSize: 13.5, lineHeight: 1.5,
              border: isMe ? 'none' : '1px solid oklch(91% 0.006 80)',
              boxShadow: '0 1px 4px oklch(70% 0.01 260 / 0.06)',
              wordBreak: 'break-word',
            }}>{msg.text}</div>
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: 'oklch(65% 0.01 260)', marginTop: 2, textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
          {fmtMessageTime(group.messages[group.messages.length - 1]?.createdAt)}
          {isMe && (
            <span style={{ color: readByOther ? 'oklch(52% 0.2 260)' : 'oklch(72% 0.01 260)', fontSize: 11 }}>
              {readByOther ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation row with hover-delete ──────────────────────────────────────

function ConvRow({ cv, isActive, isOnline, onSelect, onDelete, onProfile }) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const unread = cv.unreadCount || 0;
  const lastText = cv.lastMessage?.text || '';
  const lastTime = cv.lastMessage?.sentAt || cv.createdAt;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    onDelete(cv.id);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div style={{ padding: '10px 16px', borderBottom: '1px solid oklch(96% 0.004 80)', background: 'oklch(99% 0.008 20)' }}>
        <div style={{ fontSize: 12, color: 'oklch(35% 0.01 260)', marginBottom: 8, fontWeight: 500 }}>
          Delete chat with <strong>{cv.otherUser?.fullName || cv.otherUser?.username}</strong>?
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleConfirm}
            style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', background: 'oklch(52% 0.18 20)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Delete
          </button>
          <button onClick={handleCancel}
            style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: '1px solid oklch(88% 0.008 260)', background: 'white', color: 'oklch(44% 0.01 260)', fontSize: 12, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', cursor: 'pointer', background: isActive ? 'oklch(95% 0.015 260)' : hovered ? 'oklch(97.5% 0.008 260)' : 'white', borderBottom: '1px solid oklch(96% 0.004 80)', transition: 'background 0.1s', position: 'relative' }}>
      <div onClick={(e) => { if (onProfile && cv.otherUser?.id) { e.stopPropagation(); onProfile(cv.otherUser.id); } }} style={{ cursor: onProfile && cv.otherUser?.id ? 'pointer' : 'default', flexShrink: 0 }}>
        <Avatar user={cv.otherUser} size={40} showOnline isOnline={isOnline} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: unread ? 700 : 500, color: 'oklch(18% 0.015 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cv.otherUser?.fullName || cv.otherUser?.username || 'Unknown'}
          </span>
          <span style={{ fontSize: 10.5, color: 'oklch(62% 0.01 260)', flexShrink: 0, marginLeft: 4 }}>{fmtTime(lastTime)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: 'oklch(52% 0.01 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread ? 600 : 400, flex: 1 }}>
            {lastText || <span style={{ color: 'oklch(68% 0.01 260)', fontStyle: 'italic' }}>No messages yet</span>}
          </div>
          {unread > 0 && !hovered && (
            <div style={{ flexShrink: 0, marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', padding: '0 4px' }}>
              {unread}
            </div>
          )}
        </div>
      </div>
      {/* Trash button — fades in on hover */}
      <button
        onClick={handleDeleteClick}
        title="Delete chat"
        style={{ flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'oklch(58% 0.01 260)', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s, background 0.1s' }}
        onMouseEnter={e => { setHovered(true); e.currentTarget.style.background = 'oklch(92% 0.04 20)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1,3 13,3" />
          <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
          <rect x="2" y="3" width="10" height="9" rx="1.5" />
          <line x1="5.5" y1="6" x2="5.5" y2="9.5" />
          <line x1="8.5" y1="6" x2="8.5" y2="9.5" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagesView({ initialUserId = null, onProfile }) {
  const { user } = useAuth();
  const socket = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]); // for active conversation
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv?.otherUser;

  // ── Load conversations ─────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── If opened with a userId (from profile/explore), start that conversation ─
  // NOTE: `conversations` intentionally excluded from deps — we only want this
  // to run once after convos finish loading, not on every convo list update.
  const initialUserHandledRef = useRef(false);
  useEffect(() => {
    if (!initialUserId || loadingConvs) return;
    if (initialUserHandledRef.current) return;
    initialUserHandledRef.current = true;

    const existing = conversations.find(c => c.otherUser?.id === initialUserId);
    if (existing) {
      setActiveConvId(existing.id);
    } else {
      api.getOrCreateConversation(initialUserId).then(({ conversation }) => {
        setConversations(prev => {
          if (prev.find(c => c.id === conversation.id)) return prev;
          return [conversation, ...prev];
        });
        setActiveConvId(conversation.id);
        socket?.joinConversation(conversation.id);
      }).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, loadingConvs]);

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    setMessages([]);
    api.getMessages(activeConvId, { limit: 50 }).then(({ messages: msgs }) => {
      setMessages(msgs || []);
      setHasMore((msgs || []).length === 50);
      // Mark as read via socket
      socket?.emitMarkRead(activeConvId);
      // Clear unread count in local state
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c));
    }).catch(console.error).finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  // ── Scroll to bottom when messages change ─────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Socket event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const offMsg = socket.on('new_message', ({ conversationId, message }) => {
      // Skip messages we sent — already handled optimistically in send()
      if (message.senderId === user?.id) return;

      if (conversationId === activeConvId) {
        setMessages(prev => [...prev, message]);
        socket.emitMarkRead(conversationId);
      } else {
        // Bump unread count
        setConversations(prev => prev.map(c => {
          if (c.id !== conversationId) return c;
          return { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: { text: message.text, sentAt: message.createdAt, senderId: message.senderId } };
        }));
      }
      // Re-sort convos by latest message
      setConversations(prev => {
        const updated = prev.map(c => c.id === conversationId
          ? { ...c, lastMessage: { text: message.text, sentAt: message.createdAt, senderId: message.senderId } }
          : c
        );
        return [...updated].sort((a, b) => {
          const ta = a.lastMessage?.sentAt || a.createdAt;
          const tb = b.lastMessage?.sentAt || b.createdAt;
          return new Date(tb) - new Date(ta);
        });
      });
    });

    const offRead = socket.on('messages_read', ({ conversationId, readBy }) => {
      if (conversationId === activeConvId && readBy !== user?.id) {
        // Mark my messages as read by other
        setMessages(prev => prev.map(m => m.senderId === user?.id && !m.readBy.includes(readBy)
          ? { ...m, readBy: [...m.readBy, readBy] }
          : m
        ));
      }
    });

    return () => { offMsg?.(); offRead?.(); };
  }, [socket, activeConvId, user]);

  // ── Query online status for conversation users ─────────────────────────────
  useEffect(() => {
    if (!socket || conversations.length === 0) return;
    const ids = conversations.map(c => c.otherUser?.id).filter(Boolean);
    socket.queryOnlineUsers(ids).then(online => {
      online.forEach(id => {
        // socket context already updates onlineUsers map; this just seeds it
      });
    });
  }, [socket, conversations]);

  // ── Send message ───────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeConvId || sending) return;
    setInput('');
    setSending(true);

    // Stop typing
    if (isTypingRef.current) {
      socket?.emitTypingStop(activeConvId);
      isTypingRef.current = false;
    }
    clearTimeout(typingTimerRef.current);

    // Optimistic message
    const optimistic = {
      id: `opt_${Date.now()}`,
      conversationId: activeConvId,
      senderId: user.id,
      text,
      readBy: [user.id],
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await socket?.sendMessage({ conversationId: activeConvId, text });
      // Replace optimistic with server message
      if (res?.message) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? res.message : m));
      }
    } catch {
      // Remove optimistic on failure, restore input
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, activeConvId, sending, socket, user]);

  // ── Typing indicators ──────────────────────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    if (!activeConvId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket?.emitTypingStart(activeConvId);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket?.emitTypingStop(activeConvId);
    }, 2000);
  }, [activeConvId, socket]);

  // ── Load more (pagination) ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || !activeConvId || messages.length === 0) return;
    const oldest = messages[0]?.createdAt;
    try {
      const { messages: older } = await api.getMessages(activeConvId, { limit: 50, before: oldest });
      setMessages(prev => [...(older || []), ...prev]);
      setHasMore((older || []).length === 50);
    } catch {}
  }, [hasMore, activeConvId, messages]);

  // ── Delete (hide) conversation ────────────────────────────────────────────
  const handleDeleteConv = useCallback(async (convId) => {
    try {
      await api.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) setActiveConvId(null);
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  }, [activeConvId]);

  // ── Start new conversation from modal ─────────────────────────────────────
  const handleStartChat = useCallback(async (targetUser) => {
    setShowNewChat(false);
    try {
      const { conversation } = await api.getOrCreateConversation(targetUser.id);
      setConversations(prev => {
        if (prev.find(c => c.id === conversation.id)) return prev;
        return [conversation, ...prev];
      });
      setActiveConvId(conversation.id);
      socket?.joinConversation(conversation.id);
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  }, [socket]);

  // ── Group messages by sender + minute ─────────────────────────────────────
  const messageGroups = (() => {
    const groups = [];
    messages.forEach(msg => {
      const last = groups[groups.length - 1];
      const msgMinute = msg.createdAt?.slice(0, 16);
      const lastMinute = last?.messages[0]?.createdAt?.slice(0, 16);
      if (last && last.senderId === msg.senderId && msgMinute === lastMinute) {
        last.messages.push(msg);
      } else {
        groups.push({ senderId: msg.senderId, senderUser: msg.senderId === user?.id ? user : otherUser, messages: [msg] });
      }
    });
    return groups;
  })();

  const isTyping = socket?.typingMap?.[activeConvId] && socket.typingMap[activeConvId] !== user?.id;
  const isOtherOnline = otherUser ? !!socket?.onlineUsers?.[otherUser.id] : false;

  const filteredConvs = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const n = (c.otherUser?.fullName || '').toLowerCase();
    const u = (c.otherUser?.username || '').toLowerCase();
    return n.includes(q) || u.includes(q);
  });

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onStart={handleStartChat} currentUserId={user?.id} />}

      {/* ── Conversation list ─────────────────────────────────────────────── */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid oklch(91% 0.006 80)', overflowY: 'auto', background: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid oklch(94% 0.004 80)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'oklch(32% 0.01 260)' }}>Messages</span>
            <button onClick={() => setShowNewChat(true)}
              title="New message"
              style={{ border: 'none', background: 'oklch(95% 0.015 260)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'oklch(45% 0.15 260)' }}>
              +
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'oklch(65% 0.01 260)' }}>⌕</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: 8, border: '1px solid oklch(90% 0.008 260)', fontSize: 12.5, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', background: 'oklch(98.5% 0.005 80)', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'oklch(60% 0.01 260)' }}>Loading…</div>
          )}
          {!loadingConvs && filteredConvs.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'oklch(60% 0.01 260)', marginBottom: 8 }}>No conversations yet</div>
              <button onClick={() => setShowNewChat(true)}
                style={{ border: '1px solid oklch(88% 0.008 260)', background: 'white', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, cursor: 'pointer', color: 'oklch(45% 0.15 260)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Start a conversation
              </button>
            </div>
          )}
          {filteredConvs.map(cv => (
            <ConvRow
              key={cv.id}
              cv={cv}
              isActive={cv.id === activeConvId}
              isOnline={!!socket?.onlineUsers?.[cv.otherUser?.id]}
              onSelect={() => setActiveConvId(cv.id)}
              onDelete={handleDeleteConv}
              onProfile={onProfile}
            />
          ))}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'oklch(98.5% 0.003 80)' }}>
        {!activeConvId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'oklch(60% 0.01 260)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Your Messages</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Send a message to start a conversation</div>
            <button onClick={() => setShowNewChat(true)}
              style={{ background: 'oklch(52% 0.2 260)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              New message
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid oklch(91% 0.006 80)', background: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={() => onProfile && otherUser?.id && onProfile(otherUser.id)} style={{ cursor: onProfile && otherUser?.id ? 'pointer' : 'default' }}>
                <Avatar user={otherUser} size={36} showOnline isOnline={isOtherOnline} />
              </div>
              <div>
                <div onClick={() => onProfile && otherUser?.id && onProfile(otherUser.id)}
                  style={{ fontSize: 14, fontWeight: 600, cursor: onProfile && otherUser?.id ? 'pointer' : 'default', display: 'inline-block' }}
                  onMouseEnter={e => { if (onProfile && otherUser?.id) e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
                  {otherUser?.fullName || otherUser?.username}
                </div>
                <div style={{ fontSize: 11.5, color: isOtherOnline ? '#22c55e' : 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {isOtherOnline ? 'Online' : `@${otherUser?.username || ''}`}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {hasMore && (
                <button onClick={loadMore}
                  style={{ alignSelf: 'center', border: '1px solid oklch(88% 0.008 260)', background: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: 'oklch(45% 0.15 260)', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Load older messages
                </button>
              )}
              {loadingMsgs && (
                <div style={{ textAlign: 'center', padding: 20, color: 'oklch(65% 0.01 260)', fontSize: 13 }}>Loading messages…</div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'oklch(65% 0.01 260)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>👋</div>
                  <div style={{ fontSize: 13 }}>Say hello to {otherUser?.fullName || otherUser?.username}!</div>
                </div>
              )}
              {messageGroups.map((group, gi) => {
                const isMe = group.senderId === user?.id;
                // Check if the last message in the group has been read by the other user
                const lastMsg = group.messages[group.messages.length - 1];
                const readByOther = isMe && lastMsg?.readBy?.includes(otherUser?.id);
                return (
                  <MessageGroup key={gi} group={group} isMe={isMe} readByOther={readByOther} />
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                  <Avatar user={otherUser} size={28} />
                  <div style={{ padding: '9px 14px', background: 'white', border: '1px solid oklch(91% 0.006 80)', borderRadius: '14px 14px 14px 4px', boxShadow: '0 1px 4px oklch(70% 0.01 260 / 0.06)' }}>
                    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 6, height: 6, borderRadius: '50%', background: 'oklch(65% 0.01 260)',
                          animation: `typing-dot 1.2s ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0, padding: '14px 20px', borderTop: '1px solid oklch(91% 0.006 80)', background: 'white', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, border: '1px solid oklch(88% 0.008 260)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(98.5% 0.005 80)' }}>
                <input value={input} onChange={handleInputChange}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Send a message…"
                  style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(18% 0.015 260)' }} />
              </div>
              <button onClick={send} disabled={!input.trim() || sending}
                style={{ width: 40, height: 40, borderRadius: 11, border: 'none', background: input.trim() ? 'oklch(52% 0.2 260)' : 'oklch(88% 0.005 260)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0, fontSize: 16, transition: 'background 0.15s' }}>
                ↑
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
