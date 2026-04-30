import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../config/api';
import { QUERY_KEYS } from '../config/queryClient';
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

function Avatar({ user, size = 40, showOnline = false, isOnline = false, dotBorder = 'white' }) {
  const ini = getInitials(user?.fullName || user?.username || '?');
  const color = avatarColor(user?.id || '');
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt={ini} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700, color: 'white' }}>{ini}</div>
      }
      {showOnline && (
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: isOnline ? '#22c55e' : '#94a3b8', border: `2px solid ${dotBorder}` }} />
      )}
    </div>
  );
}

// ─── New chat modal ───────────────────────────────────────────────────────────

function NewChatModal({ onClose, onStart, currentUserId, isDark }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const m = {
    modalBg:     isDark ? 'oklch(20% 0.012 260)' : 'white',
    border:      isDark ? 'oklch(30% 0.012 260)' : 'oklch(91% 0.006 80)',
    borderFaint: isDark ? 'oklch(26% 0.01 260)'  : 'oklch(93% 0.004 80)',
    borderSub:   isDark ? 'oklch(26% 0.01 260)'  : 'oklch(94% 0.004 80)',
    textPri:     isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)',
    textSec:     isDark ? 'oklch(65% 0.01 260)'  : 'oklch(55% 0.01 260)',
    textMuted:   isDark ? 'oklch(58% 0.01 260)'  : 'oklch(58% 0.01 260)',
    inputBg:     isDark ? 'oklch(24% 0.01 260)'  : 'oklch(97.5% 0.006 260)',
    inputBorder: isDark ? 'oklch(32% 0.012 260)' : 'oklch(90% 0.008 260)',
    rowHover:    isDark ? 'oklch(24% 0.015 260)' : 'oklch(96.5% 0.01 260)',
    rowDefault:  isDark ? 'oklch(20% 0.012 260)' : 'white',
    closeBtnBg:  isDark ? 'oklch(26% 0.01 260)'  : 'oklch(95% 0.006 80)',
    shadow:      isDark ? '0 8px 48px oklch(5% 0.01 260 / 0.55)' : '0 8px 48px oklch(25% 0.05 260 / 0.18), 0 1px 3px oklch(25% 0.05 260 / 0.08)',
  };

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
      <div style={{ background: m.modalBg, borderRadius: 16, width: 400, maxHeight: 520, display: 'flex', flexDirection: 'column', boxShadow: m.shadow, border: `1px solid ${m.border}` }}>

        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${m.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: m.textPri }}>New message</div>
          <button onClick={onClose}
            style={{ border: 'none', background: m.closeBtnBg, borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.textMuted, fontSize: 14, lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${m.borderSub}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: m.inputBg, border: `1px solid ${m.inputBorder}`, borderRadius: 10, padding: '8px 12px', transition: 'border 0.12s' }}
            onFocusCapture={e => e.currentTarget.style.border = '1px solid oklch(72% 0.12 260)'}
            onBlurCapture={e => e.currentTarget.style.border = `1px solid ${m.inputBorder}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={m.textMuted} strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="12.5" y2="12.5" /></svg>
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or @username…"
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: m.textPri }}
            />
            {query && (
              <button onClick={() => setQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: m.textMuted, fontSize: 13, lineHeight: 1 }}>✕</button>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!query.trim() && results.length > 0 && (
            <div style={{ padding: '8px 18px 4px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: m.textMuted }}>
              Suggested
            </div>
          )}
          {loading && (
            <div style={{ padding: '20px 18px', fontSize: 13, color: m.textMuted, textAlign: 'center' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <div style={{ padding: '28px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'oklch(72% 0.01 260)' : 'oklch(35% 0.01 260)', marginBottom: 4 }}>No users found</div>
              <div style={{ fontSize: 12, color: m.textMuted }}>Try a different name or username</div>
            </div>
          )}
          {!loading && results.map(u => (
            <div
              key={u.id}
              onClick={() => onStart(u)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', borderBottom: `1px solid ${m.borderFaint}`, transition: 'background 0.1s', background: m.rowDefault }}
              onMouseEnter={e => e.currentTarget.style.background = m.rowHover}
              onMouseLeave={e => e.currentTarget.style.background = m.rowDefault}>
              <Avatar user={u} size={36} dotBorder={isDark ? 'oklch(20% 0.012 260)' : 'white'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: m.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName || u.username}</div>
                <div style={{ fontSize: 11.5, color: m.textSec, fontFamily: "'JetBrains Mono', monospace" }}>@{u.username}</div>
              </div>
              <div style={{ fontSize: 11, color: m.textMuted, flexShrink: 0 }}>
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

function MessageGroup({ group, isMe, readByOther, isMobile, onCommitClick, isDark }) {
  const incomingBg     = isDark ? 'oklch(26% 0.012 260)' : 'white';
  const incomingColor  = isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)';
  const incomingBorder = isDark ? 'oklch(32% 0.012 260)' : 'oklch(91% 0.006 80)';
  const commitCardBg   = isDark ? 'oklch(24% 0.012 260)' : 'white';
  const commitCardHov  = isDark ? 'oklch(27% 0.015 260)' : 'oklch(97% 0.01 260)';
  const commitBorder   = isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)';
  const commitMsgColor = isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)';
  const commitSubColor = isDark ? 'oklch(62% 0.01 260)' : 'oklch(58% 0.01 260)';
  const dotBorder      = isDark ? 'oklch(18% 0.008 260)' : 'oklch(98.5% 0.003 80)';

  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
      {!isMe && (
        <Avatar user={group.senderUser} size={28} dotBorder={dotBorder} />
      )}
      <div style={{ maxWidth: isMobile ? '78%' : '65%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {group.messages.map((msg, mi) => (
          <div key={msg.id}>
            {msg.sharedCommit && (
              <div
                onClick={() => onCommitClick?.(msg.sharedCommit.id)}
                style={{ background: commitCardBg, border: `1px solid ${commitBorder}`, borderRadius: 10, padding: '10px 12px', marginBottom: 4, cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = commitCardHov}
                onMouseLeave={e => e.currentTarget.style.background = commitCardBg}
              >
                <div style={{ fontSize: 10, color: 'oklch(52% 0.2 260)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⎇</span> Shared commit · <span style={{ fontWeight: 400, color: commitSubColor }}>tap to view</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4, color: commitMsgColor }}>{msg.sharedCommit.message}</div>
                <BranchPill name={msg.sharedCommit.branch} wi={false} merged={false} />
              </div>
            )}
            <div style={{
              padding: '8px 13px',
              borderRadius: (() => {
                const only = group.messages.length === 1, first = mi === 0, last = mi === group.messages.length - 1;
                if (only) return '16px';
                if (isMe) {
                  if (first) return '16px 16px 4px 16px';
                  if (last) return '16px 4px 16px 16px';
                  return '16px 4px 4px 16px';
                } else {
                  if (first) return '16px 16px 16px 4px';
                  if (last) return '4px 16px 16px 16px';
                  return '4px 16px 16px 4px';
                }
              })(),
              background: isMe ? 'oklch(52% 0.2 260)' : incomingBg,
              color: isMe ? 'white' : incomingColor,
              fontSize: 13.5, lineHeight: 1.5,
              border: isMe ? 'none' : `1px solid ${incomingBorder}`,
              wordBreak: 'break-word',
            }}>{msg.text}</div>
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: 'oklch(65% 0.01 260)', marginTop: 1, textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
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

function ConvRow({ cv, isActive, isOnline, onSelect, onDelete, onProfile, isMobile, isDark }) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const unread = cv.unreadCount || 0;
  const lastText = cv.lastMessage?.text || '';
  const lastTime = cv.lastMessage?.sentAt || cv.createdAt;

  const rowBg     = isDark ? 'oklch(18% 0.01 260)' : 'white';
  const activeBg  = isDark ? 'oklch(24% 0.02 260)'  : 'oklch(95% 0.015 260)';
  const hoverBg   = isDark ? 'oklch(22% 0.012 260)' : 'oklch(97.5% 0.008 260)';
  const borderCol = isDark ? 'oklch(26% 0.01 260)'  : 'oklch(96% 0.004 80)';
  const textPri   = isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)';
  const textSec   = isDark ? 'oklch(60% 0.01 260)'  : 'oklch(52% 0.01 260)';
  const textMuted = isDark ? 'oklch(55% 0.01 260)'  : 'oklch(62% 0.01 260)';
  const dotBorder = isDark ? 'oklch(18% 0.01 260)'  : 'white';
  const trashHov  = isDark ? 'oklch(28% 0.05 20)'   : 'oklch(92% 0.04 20)';
  const confirmBg = isDark ? 'oklch(20% 0.015 20)'  : 'oklch(99% 0.008 20)';
  const cancelBg  = isDark ? 'oklch(24% 0.012 260)' : 'white';
  const cancelCol = isDark ? 'oklch(68% 0.01 260)'  : 'oklch(44% 0.01 260)';
  const cancelBdr = isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)';

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
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${borderCol}`, background: confirmBg }}>
        <div style={{ fontSize: 12, color: isDark ? 'oklch(72% 0.01 260)' : 'oklch(35% 0.01 260)', marginBottom: 8, fontWeight: 500 }}>
          Delete chat with <strong>{cv.otherUser?.fullName || cv.otherUser?.username}</strong>?
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={handleConfirm}
            style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', background: 'oklch(52% 0.18 20)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Delete
          </button>
          <button type="button" onClick={handleCancel}
            style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: `1px solid ${cancelBdr}`, background: cancelBg, color: cancelCol, fontSize: 12, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // On mobile: no hover state (touch events leave hover stuck), show delete inline
  const showDelete = isMobile ? true : hovered;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => { if (!isMobile) setHovered(true); }}
      onMouseLeave={() => { if (!isMobile) setHovered(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', cursor: 'pointer',
        background: isActive ? activeBg : hovered ? hoverBg : rowBg,
        borderBottom: `1px solid ${borderCol}`,
        transition: isMobile ? 'none' : 'background 0.1s',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
      }}>
      <div onClick={(e) => { if (onProfile && cv.otherUser?.id) { e.stopPropagation(); onProfile(cv.otherUser.id); } }} style={{ cursor: onProfile && cv.otherUser?.id ? 'pointer' : 'default', flexShrink: 0 }}>
        <Avatar user={cv.otherUser} size={40} showOnline isOnline={isOnline} dotBorder={dotBorder} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: unread ? 700 : 500, color: textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cv.otherUser?.fullName || cv.otherUser?.username || 'Unknown'}
          </span>
          <span style={{ fontSize: 10.5, color: textMuted, flexShrink: 0, marginLeft: 4 }}>{fmtTime(lastTime)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread ? 600 : 400, flex: 1 }}>
            {lastText || <span style={{ color: textMuted, fontStyle: 'italic' }}>No messages yet</span>}
          </div>
          {unread > 0 && (isMobile || !hovered) && (
            <div style={{ flexShrink: 0, marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', padding: '0 4px' }}>
              {unread}
            </div>
          )}
        </div>
      </div>
      {/* Trash button — always visible on mobile, fades in on hover on desktop */}
      <button
        type="button"
        onClick={handleDeleteClick}
        title="Delete chat"
        style={{
          flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
          color: textSec,
          opacity: showDelete ? (isMobile ? 0.45 : 1) : 0,
          transition: isMobile ? 'none' : 'opacity 0.15s, background 0.1s',
        }}
        onMouseEnter={e => { if (!isMobile) { setHovered(true); e.currentTarget.style.background = trashHov; } }}
        onMouseLeave={e => { if (!isMobile) e.currentTarget.style.background = 'none'; }}>
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

export default function MessagesView({ onProfile, isMobile, onMobilePaneChange }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialUserId = searchParams.get('user') || null;
  const initialCommitId = searchParams.get('commitId') || null;
  const initialCommitMsg = searchParams.get('commitMsg') || null;
  const initialCommitBranch = searchParams.get('commitBranch') || null;
  const { user } = useAuth();
  const socket = useSocket();
  const { isDark } = useTheme();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]); // for active conversation
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  // Commit shared via "Send in DM" — pre-populated from URL params
  const [pendingCommit, setPendingCommit] = useState(
    initialCommitId ? { id: initialCommitId, message: initialCommitMsg, branch: initialCommitBranch } : null
  );
  // Mobile: track which pane is visible ('list' or 'chat')
  const [mobilePane, setMobilePane] = useState('list');
  const switchPane = useCallback((pane) => {
    setMobilePane(pane);
    onMobilePaneChange?.(pane);
  }, [onMobilePaneChange]);

  // ── iOS Safari: use visualViewport to set actual height when keyboard opens ─
  const chatPaneRef = useRef(null);
  useEffect(() => {
    if (!isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      if (chatPaneRef.current) {
        chatPaneRef.current.style.height = vv.height + 'px';
        chatPaneRef.current.style.top = vv.offsetTop + 'px';
      }
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [isMobile, mobilePane]);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const inputValueRef = useRef('');
  const conversationsRef = useRef([]);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv?.otherUser;

  // ── Load conversations via React Query (cached) ────────────────────────────
  const { data: convsData, isLoading: loadingConvs } = useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: () => api.getConversations(),
    staleTime: 30_000,
  });

  // Seed local conversations state from query cache once on load
  // (socket events then keep local state up-to-date)
  useEffect(() => {
    if (convsData) {
      setConversations(convsData.conversations || []);
    }
  }, [convsData]);

  // Keep ref in sync so socket callbacks can read current conversations without stale closure
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

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
      switchPane('chat');
    } else {
      api.getOrCreateConversation(initialUserId).then(({ conversation }) => {
        setConversations(prev => {
          if (prev.find(c => c.id === conversation.id)) return prev;
          return [conversation, ...prev];
        });
        setActiveConvId(conversation.id);
        switchPane('chat');
        socket?.joinConversation(conversation.id, initialUserId);
      }).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, loadingConvs]);

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    setMessages([]);
    inputRef.current?.focus();
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
      console.log('[new_message]', { conversationId, activeConvId, senderId: message.senderId, myId: user?.id });
      // Skip messages we sent — already handled optimistically in send()
      if (message.senderId === user?.id) return;

      // If this conversation isn't in our list yet (first message from someone),
      // refresh the conversation list to pick it up
      if (!conversationsRef.current.find(c => c.id === conversationId)) {
        console.log('[new_message] unknown conv, refreshing list');
        api.getConversations().then(({ conversations: fresh }) => {
          setConversations(fresh);
        }).catch(() => {});
        return;
      }

      if (conversationId === activeConvId) {
        console.log('[new_message] adding to active chat');
        setMessages(prev => {
          // Deduplicate — ignore if we already have this message id
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        socket.emitMarkRead(conversationId);
      } else {
        console.log('[new_message] inactive conv, bumping unread');
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

    const offConvUpdated = socket.on('conversation_updated', () => {
      // Conversation metadata changed (e.g. last message) — refresh the list
      api.getConversations().then(({ conversations: fresh }) => {
        setConversations(fresh);
      }).catch(() => {});
    });

    const offSaved = socket.on('message_saved', ({ tempId, message }) => {
      setMessages(prev => prev.map(m => m.id === tempId ? message : m));
    });

    const offFailed = socket.on('message_failed', ({ tempId }) => {
      setMessages(prev => prev.filter(m => m.id !== tempId));
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

    return () => { offMsg?.(); offRead?.(); offSaved?.(); offFailed?.(); offConvUpdated?.(); };
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
  const sendingRef = useRef(false);
  const activeConvIdRef = useRef(activeConvId);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  const pendingCommitRef = useRef(pendingCommit);
  useEffect(() => { pendingCommitRef.current = pendingCommit; }, [pendingCommit]);

  const send = useCallback(async () => {
    const text = (inputRef.current?.value ?? inputValueRef.current).trim();
    const convId = activeConvIdRef.current;
    const sharedCommit = pendingCommitRef.current || undefined;
    if ((!text && !sharedCommit) || !convId || sendingRef.current) return;
    inputValueRef.current = '';
    if (inputRef.current) inputRef.current.value = '';
    setInput('');
    setPendingCommit(null);
    sendingRef.current = true;
    setSending(true);

    // Stop typing
    if (isTypingRef.current) {
      socket?.emitTypingStop(convId);
      isTypingRef.current = false;
    }
    clearTimeout(typingTimerRef.current);

    // Optimistic message
    const optimistic = {
      id: `opt_${Date.now()}`,
      conversationId: convId,
      senderId: user.id,
      text,
      sharedCommit: sharedCommit || null,
      readBy: [user.id],
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    // Release the lock immediately so the user can type the next message
    sendingRef.current = false;
    setSending(false);

    // Include participant ids so server can broadcast to personal rooms (guarantees delivery)
    const participants = activeConv?.participants || [user.id, otherUser?.id].filter(Boolean);

    // Fire-and-forget via socket — server acks instantly, reconciles via message_saved/message_failed events
    // Fall back to REST only if socket fails (disconnected etc.)
    socket?.sendMessage({ conversationId: convId, text, sharedCommit, participants }).catch(async () => {
      try {
        const res = await api.sendMessageREST(convId, text, sharedCommit);
        if (res?.message) {
          setMessages(prev => prev.map(m => m.id === optimistic.id ? res.message : m));
        }
      } catch {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        inputValueRef.current = text;
        setInput(text);
      }
    });
  }, [socket, user]);

  // ── Typing indicators ──────────────────────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    inputValueRef.current = e.target.value;
    setInput(e.target.value);
    const convId = activeConvIdRef.current;
    if (!convId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket?.emitTypingStart(convId);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket?.emitTypingStop(convId);
    }, 2000);
  }, [socket]);

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
      switchPane('chat');
      socket?.joinConversation(conversation.id, targetUser.id);
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

  const showList = !isMobile || mobilePane === 'list';
  const showChat = !isMobile || mobilePane === 'chat';

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onStart={handleStartChat} currentUserId={user?.id} isDark={isDark} />}

      {/* ── Conversation list ─────────────────────────────────────────────── */}
      <div style={{
        width: isMobile ? '100%' : 'var(--messages-list-width, 280px)',
        flexShrink: 0,
        borderRight: isMobile ? 'none' : `1px solid ${isDark ? 'oklch(26% 0.01 260)' : 'oklch(91% 0.006 80)'}`,
        overflowY: 'auto',
        background: isDark ? 'oklch(18% 0.01 260)' : 'white',
        display: showList ? 'flex' : 'none',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 16px 10px', borderBottom: `1px solid ${isDark ? 'oklch(26% 0.01 260)' : 'oklch(94% 0.004 80)'}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? 'oklch(85% 0.01 260)' : 'oklch(32% 0.01 260)' }}>Messages</span>
            <button onClick={() => setShowNewChat(true)}
              title="New message"
              style={{ border: 'none', background: isDark ? 'oklch(26% 0.02 260)' : 'oklch(95% 0.015 260)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: isDark ? 'oklch(72% 0.15 260)' : 'oklch(45% 0.15 260)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="7" y1="2" x2="7" y2="12" />
                <line x1="2" y1="7" x2="12" y2="7" />
              </svg>
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: isDark ? 'oklch(55% 0.01 260)' : 'oklch(65% 0.01 260)' }}>⌕</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: 8, border: `1px solid ${isDark ? 'oklch(30% 0.012 260)' : 'oklch(90% 0.008 260)'}`, fontSize: 12.5, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', background: isDark ? 'oklch(22% 0.01 260)' : 'oklch(98.5% 0.005 80)', color: isDark ? 'oklch(88% 0.008 260)' : 'oklch(18% 0.015 260)', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: isDark ? 'oklch(55% 0.01 260)' : 'oklch(60% 0.01 260)' }}>Loading…</div>
          )}
          {!loadingConvs && filteredConvs.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: isDark ? 'oklch(55% 0.01 260)' : 'oklch(60% 0.01 260)', marginBottom: 8 }}>No conversations yet</div>
              <button onClick={() => setShowNewChat(true)}
                style={{ border: `1px solid ${isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)'}`, background: isDark ? 'oklch(24% 0.012 260)' : 'white', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, cursor: 'pointer', color: isDark ? 'oklch(72% 0.15 260)' : 'oklch(45% 0.15 260)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
              onSelect={() => { setActiveConvId(cv.id); switchPane('chat'); }}
              onDelete={handleDeleteConv}
              onProfile={onProfile}
              isMobile={isMobile}
              isDark={isDark}
            />
          ))}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────────── */}
      {(() => {
        const chatBg      = isDark ? 'oklch(15% 0.01 260)'  : 'oklch(98.5% 0.003 80)';
        const headerBg    = isDark ? 'oklch(18% 0.01 260)'  : 'white';
        const headerBdr   = isDark ? 'oklch(26% 0.01 260)'  : 'oklch(91% 0.006 80)';
        const inputBarBg  = isDark ? 'oklch(18% 0.01 260)'  : 'white';
        const inputBarBdr = isDark ? 'oklch(26% 0.01 260)'  : 'oklch(91% 0.006 80)';
        const inputFieldBg  = isDark ? 'oklch(22% 0.01 260)'  : 'oklch(98.5% 0.005 80)';
        const inputFieldBdr = isDark ? 'oklch(30% 0.012 260)' : 'oklch(88% 0.008 260)';
        const inputTextColor = isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)';
        const headerTextPri = isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)';
        const textMuted   = isDark ? 'oklch(58% 0.01 260)'  : 'oklch(60% 0.01 260)';
        const loadMoreBg  = isDark ? 'oklch(22% 0.012 260)' : 'white';
        const loadMoreBdr = isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)';
        const loadMoreCol = isDark ? 'oklch(72% 0.15 260)'  : 'oklch(45% 0.15 260)';
        const typingBg    = isDark ? 'oklch(26% 0.012 260)' : 'white';
        const typingBdr   = isDark ? 'oklch(32% 0.012 260)' : 'oklch(91% 0.006 80)';
        const pendingBg   = isDark ? 'oklch(22% 0.018 260)' : 'oklch(97% 0.012 260)';
        const pendingBdr  = isDark ? 'oklch(32% 0.02 260)'  : 'oklch(88% 0.015 260)';
        const pendingMsg  = isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)';
        const dotBorderChat = isDark ? 'oklch(15% 0.01 260)' : 'oklch(98.5% 0.003 80)';
        const sendInactiveBg = isDark ? 'oklch(28% 0.01 260)' : 'oklch(88% 0.005 260)';
        return (
        <div ref={isMobile && mobilePane === 'chat' ? chatPaneRef : undefined} style={isMobile && mobilePane === 'chat' ? { position: 'fixed', left: 0, right: 0, top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: chatBg, zIndex: 50 } : { flex: 1, display: showChat ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden', background: chatBg, minWidth: 0 }}>
          {!activeConvId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isDark ? 'oklch(58% 0.01 260)' : 'oklch(60% 0.01 260)' }}>
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
              <div style={{ flexShrink: 0, paddingTop: isMobile ? 'calc(10px + env(safe-area-inset-top, 0px))' : '14px', paddingBottom: isMobile ? '10px' : '14px', paddingLeft: isMobile ? '12px' : '20px', paddingRight: isMobile ? '12px' : '20px', borderBottom: `1px solid ${headerBdr}`, background: headerBg, display: 'flex', alignItems: 'center', gap: 12 }}>
                {isMobile && (
                  <button
                    onClick={() => switchPane('list')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', color: 'oklch(42% 0.2 260)', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="12 4 6 10 12 16" />
                    </svg>
                  </button>
                )}
                <div onClick={() => onProfile && otherUser?.id && onProfile(otherUser.id)} style={{ cursor: onProfile && otherUser?.id ? 'pointer' : 'default' }}>
                  <Avatar user={otherUser} size={36} showOnline isOnline={isOtherOnline} dotBorder={headerBg} />
                </div>
                <div>
                  <div onClick={() => onProfile && otherUser?.id && onProfile(otherUser.id)}
                    style={{ fontSize: 14, fontWeight: 600, cursor: onProfile && otherUser?.id ? 'pointer' : 'default', display: 'inline-block', color: headerTextPri }}
                    onMouseEnter={e => { if (onProfile && otherUser?.id) e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
                    {otherUser?.fullName || otherUser?.username}
                  </div>
                  <div style={{ fontSize: 11.5, color: isOtherOnline ? '#22c55e' : (isDark ? 'oklch(55% 0.01 260)' : 'oklch(58% 0.01 260)'), fontFamily: "'JetBrains Mono', monospace" }}>
                    {isOtherOnline ? 'Online' : `@${otherUser?.username || ''}`}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 12px' : 'clamp(16px, 2.5vw, 32px) clamp(20px, 3vw, 48px)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {hasMore && (
                  <button onClick={loadMore}
                    style={{ alignSelf: 'center', border: `1px solid ${loadMoreBdr}`, background: loadMoreBg, borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: loadMoreCol, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Load older messages
                  </button>
                )}
                {loadingMsgs && (
                  <div style={{ textAlign: 'center', padding: 20, color: textMuted, fontSize: 13 }}>Loading messages…</div>
                )}
                {!loadingMsgs && messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>👋</div>
                    <div style={{ fontSize: 13 }}>Say hello to {otherUser?.fullName || otherUser?.username}!</div>
                  </div>
                )}
                {messageGroups.map((group, gi) => {
                  const isMe = group.senderId === user?.id;
                  const lastMsg = group.messages[group.messages.length - 1];
                  const readByOther = isMe && lastMsg?.readBy?.includes(otherUser?.id);
                  return (
                    <MessageGroup key={gi} group={group} isMe={isMe} readByOther={readByOther} isMobile={isMobile} onCommitClick={id => navigate(`/feed?post=${id}`)} isDark={isDark} />
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                    <Avatar user={otherUser} size={28} dotBorder={dotBorderChat} />
                    <div style={{ padding: '9px 14px', background: typingBg, border: `1px solid ${typingBdr}`, borderRadius: '14px 14px 14px 4px' }}>
                      <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} style={{
                            width: 6, height: 6, borderRadius: '50%', background: isDark ? 'oklch(55% 0.01 260)' : 'oklch(65% 0.01 260)',
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
              <div style={{ flexShrink: 0, padding: isMobile ? '10px 12px' : '14px 20px', paddingBottom: isMobile ? 'max(10px, env(safe-area-inset-bottom, 10px))' : '14px', borderTop: `1px solid ${inputBarBdr}`, background: inputBarBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingCommit && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: pendingBg, border: `1px solid ${pendingBdr}`, borderRadius: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: 'oklch(52% 0.2 260)', fontWeight: 600, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>⎇</span> Sharing commit
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: pendingMsg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{pendingCommit.message}</div>
                      <BranchPill name={pendingCommit.branch} wi={false} merged={false} />
                    </div>
                    <button
                      onClick={() => setPendingCommit(null)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: isDark ? 'oklch(58% 0.01 260)' : 'oklch(55% 0.01 260)', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, border: `1px solid ${inputFieldBdr}`, borderRadius: 22, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, background: inputFieldBg }}>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Send a message…"
                    style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", color: inputTextColor, minWidth: 0 }} />
                </div>
                <button
                  type="button"
                  onTouchEnd={e => { e.preventDefault(); send(); }}
                  onClick={send}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', border: 'none',
                    background: (input.trim() || pendingCommit) ? 'oklch(52% 0.2 260)' : sendInactiveBg,
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: (input.trim() || pendingCommit) ? 'pointer' : 'default', flexShrink: 0,
                    transition: 'background 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="13" x2="8" y2="3" />
                    <polyline points="4 7 8 3 12 7" />
                  </svg>
                </button>
                </div>
              </div>
            </>
          )}
        </div>
        );
      })()}

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
