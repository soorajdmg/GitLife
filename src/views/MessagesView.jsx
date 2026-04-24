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

function NewChatModal({ onClose, onStart }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchUsers(query, 10);
        setResults(data.users || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: 16, width: 380, maxHeight: 480, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid oklch(93% 0.004 80)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New message</div>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            style={{ width: '100%', padding: '9px 12px', border: '1px solid oklch(88% 0.008 260)', borderRadius: 10, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'oklch(60% 0.01 260)' }}>Searching…</div>}
          {!loading && results.length === 0 && query.trim() && (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'oklch(60% 0.01 260)' }}>No users found</div>
          )}
          {results.map(u => (
            <div key={u.id} onClick={() => onStart(u)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid oklch(96% 0.004 80)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.005 260)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <Avatar user={u} size={38} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.fullName || u.username}</div>
                <div style={{ fontSize: 12, color: 'oklch(55% 0.01 260)' }}>@{u.username}</div>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagesView({ initialUserId = null }) {
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
  useEffect(() => {
    if (!initialUserId || loadingConvs) return;
    const existing = conversations.find(c => c.otherUser?.id === initialUserId);
    if (existing) {
      setActiveConvId(existing.id);
    } else {
      // Create new conversation
      api.getOrCreateConversation(initialUserId).then(({ conversation }) => {
        setConversations(prev => {
          if (prev.find(c => c.id === conversation.id)) return prev;
          return [conversation, ...prev];
        });
        setActiveConvId(conversation.id);
        socket?.joinConversation(conversation.id);
      }).catch(console.error);
    }
  }, [initialUserId, loadingConvs, conversations, socket]);

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
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onStart={handleStartChat} />}

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
          {filteredConvs.map(cv => {
            const isActive = cv.id === activeConvId;
            const unread = cv.unreadCount || 0;
            const lastText = cv.lastMessage?.text || '';
            const lastTime = cv.lastMessage?.sentAt || cv.createdAt;
            const online = !!socket?.onlineUsers?.[cv.otherUser?.id];
            return (
              <div key={cv.id} onClick={() => setActiveConvId(cv.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', cursor: 'pointer', background: isActive ? 'oklch(95% 0.015 260)' : 'white', borderBottom: '1px solid oklch(96% 0.004 80)', transition: 'background 0.12s' }}>
                <Avatar user={cv.otherUser} size={40} showOnline isOnline={online} />
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
                    {unread > 0 && (
                      <div style={{ flexShrink: 0, marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', padding: '0 4px' }}>
                        {unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
              <Avatar user={otherUser} size={36} showOnline isOnline={isOtherOnline} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{otherUser?.fullName || otherUser?.username}</div>
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
