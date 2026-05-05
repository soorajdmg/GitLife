import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// Extract first URL from text
function extractUrl(text) {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

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

  useEffect(() => {
    api.searchUsers('', 12).then(data => {
      const arr = Array.isArray(data) ? data : (data.users || []);
      setResults(arr.filter(u => u.id !== currentUserId));
    }).catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
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
        <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${m.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: m.textPri }}>New message</div>
          <button onClick={onClose}
            style={{ border: 'none', background: m.closeBtnBg, borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.textMuted, fontSize: 14, lineHeight: 1 }}>
            ✕
          </button>
        </div>
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${m.borderSub}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: m.inputBg, border: `1px solid ${m.inputBorder}`, borderRadius: 10, padding: '8px 12px' }}
            onFocusCapture={e => e.currentTarget.style.border = '1px solid oklch(72% 0.12 260)'}
            onBlurCapture={e => e.currentTarget.style.border = `1px solid ${m.inputBorder}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={m.textMuted} strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="12.5" y2="12.5" /></svg>
            <input
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!query.trim() && results.length > 0 && (
            <div style={{ padding: '8px 18px 4px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: m.textMuted }}>
              Suggested
            </div>
          )}
          {loading && <div style={{ padding: '20px 18px', fontSize: 13, color: m.textMuted, textAlign: 'center' }}>Searching…</div>}
          {!loading && results.length === 0 && query.trim() && (
            <div style={{ padding: '28px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'oklch(72% 0.01 260)' : 'oklch(35% 0.01 260)', marginBottom: 4 }}>No users found</div>
              <div style={{ fontSize: 12, color: m.textMuted }}>Try a different name or username</div>
            </div>
          )}
          {!loading && results.map(u => (
            <div key={u.id} onClick={() => onStart(u)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', borderBottom: `1px solid ${m.borderFaint}`, transition: 'background 0.1s', background: m.rowDefault }}
              onMouseEnter={e => e.currentTarget.style.background = m.rowHover}
              onMouseLeave={e => e.currentTarget.style.background = m.rowDefault}>
              <Avatar user={u} size={36} dotBorder={isDark ? 'oklch(20% 0.012 260)' : 'white'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: m.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName || u.username}</div>
                <div style={{ fontSize: 11.5, color: m.textSec, fontFamily: "'JetBrains Mono', monospace" }}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Link Preview Card ────────────────────────────────────────────────────────

function LinkPreview({ url, isDark, isMe }) {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getLinkPreview(url).then(d => {
      if (!cancelled && (d.title || d.image)) setData(d);
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, [url]);

  if (!loaded || !data) return null;

  const bg = isMe ? 'oklch(46% 0.2 260)' : (isDark ? 'oklch(22% 0.012 260)' : 'oklch(96% 0.006 80)');
  const border = isMe ? 'oklch(48% 0.22 260)' : (isDark ? 'oklch(30% 0.012 260)' : 'oklch(88% 0.006 80)');
  const titleColor = isMe ? 'white' : (isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)');
  const descColor = isMe ? 'oklch(88% 0.04 260)' : (isDark ? 'oklch(62% 0.01 260)' : 'oklch(55% 0.01 260)');

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', marginTop: 6, borderRadius: 10, overflow: 'hidden', border: `1px solid ${border}`, background: bg, textDecoration: 'none', maxWidth: '100%' }}>
      {data.image && (
        <img src={data.image} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />
      )}
      <div style={{ padding: '8px 10px' }}>
        {data.title && <div style={{ fontSize: 12.5, fontWeight: 600, color: titleColor, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{data.title}</div>}
        {data.description && <div style={{ fontSize: 11.5, color: descColor, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{data.description}</div>}
        <div style={{ fontSize: 10.5, color: descColor, marginTop: 4, opacity: 0.7 }}>{url.replace(/^https?:\/\//, '').split('/')[0]}</div>
      </div>
    </a>
  );
}

// ─── Reaction Picker ──────────────────────────────────────────────────────────

function ReactionPicker({ onReact, isDark, isMe }) {
  const bg = isDark ? 'oklch(24% 0.015 260)' : 'white';
  const border = isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)';
  return (
    <div style={{
      position: 'absolute', bottom: '100%', [isMe ? 'right' : 'left']: 0,
      background: bg, border: `1px solid ${border}`, borderRadius: 22,
      padding: '4px 6px', display: 'flex', gap: 2, zIndex: 50,
      boxShadow: isDark ? '0 4px 16px oklch(5% 0.01 260 / 0.5)' : '0 4px 16px oklch(25% 0.05 260 / 0.14)',
      marginBottom: 4,
    }}>
      {REACTION_EMOJIS.map(e => (
        <button key={e} onClick={() => onReact(e)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 3px', borderRadius: 8, lineHeight: 1, transition: 'transform 0.1s' }}
          onMouseEnter={ev => ev.currentTarget.style.transform = 'scale(1.25)'}
          onMouseLeave={ev => ev.currentTarget.style.transform = 'scale(1)'}>
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Reaction row ─────────────────────────────────────────────────────────────

function ReactionRow({ reactions, myId, onReact, isDark, isMe }) {
  const entries = Object.entries(reactions || {}).filter(([, users]) => users.length > 0);
  if (!entries.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
      {entries.map(([emoji, users]) => {
        const mine = users.includes(myId);
        const bg = mine
          ? (isDark ? 'oklch(40% 0.18 260)' : 'oklch(90% 0.06 260)')
          : (isDark ? 'oklch(26% 0.012 260)' : 'oklch(96% 0.006 80)');
        const border = mine
          ? 'oklch(52% 0.2 260)'
          : (isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)');
        return (
          <button key={emoji} onClick={() => onReact(emoji)}
            style={{ border: `1px solid ${border}`, background: bg, borderRadius: 12, padding: '2px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, transition: 'background 0.1s' }}>
            <span>{emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? 'oklch(80% 0.01 260)' : 'oklch(35% 0.01 260)' }}>{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Message bubble group ─────────────────────────────────────────────────────

function MessageGroup({ group, isMe, readByOther, isMobile, onCommitClick, isDark, myId, otherUser, onReact, onDelete, onEdit, onReply, searchQuery }) {
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [pickerMsgId, setPickerMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef(null);

  const incomingBg     = isDark ? 'oklch(26% 0.012 260)' : 'white';
  const incomingColor  = isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)';
  const incomingBorder = isDark ? 'oklch(32% 0.012 260)' : 'oklch(91% 0.006 80)';
  const commitCardBg   = isDark ? 'oklch(24% 0.012 260)' : 'white';
  const commitCardHov  = isDark ? 'oklch(27% 0.015 260)' : 'oklch(97% 0.01 260)';
  const commitBorder   = isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)';
  const commitMsgColor = isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)';
  const commitSubColor = isDark ? 'oklch(62% 0.01 260)' : 'oklch(58% 0.01 260)';
  const dotBorder      = isDark ? 'oklch(18% 0.008 260)' : 'oklch(98.5% 0.003 80)';
  const actionBtn      = isDark ? 'oklch(26% 0.012 260)' : 'oklch(96% 0.006 80)';
  const actionBtnHov   = isDark ? 'oklch(30% 0.015 260)' : 'oklch(92% 0.01 260)';
  const replyBg        = isDark ? 'oklch(22% 0.015 260)' : 'oklch(95% 0.01 260)';
  const replyBdr       = isDark ? 'oklch(38% 0.05 260)'  : 'oklch(75% 0.08 260)';
  const replyText      = isDark ? 'oklch(68% 0.01 260)'  : 'oklch(50% 0.01 260)';
  const deletedColor   = isDark ? 'oklch(55% 0.01 260)'  : 'oklch(62% 0.01 260)';

  const startEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditText(msg.text);
    setPickerMsgId(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const submitEdit = async (msg) => {
    if (!editText.trim() || editText.trim() === msg.text) { setEditingMsgId(null); return; }
    await onEdit(msg.id, editText.trim());
    setEditingMsgId(null);
  };

  // Highlight search match
  const highlight = (text, query) => {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'oklch(80% 0.18 80)', color: 'oklch(18% 0.015 260)', borderRadius: 2, padding: '0 1px' }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
      {!isMe && (
        <Avatar user={group.senderUser} size={28} dotBorder={dotBorder} />
      )}
      <div style={{ maxWidth: isMobile ? '80%' : '65%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {group.messages.map((msg, mi) => {
          const isHovered = hoveredMsgId === msg.id;
          const isDeleted = !!msg.deletedAt;
          const url = !isDeleted ? extractUrl(msg.text) : null;

          return (
            <div key={msg.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {/* Shared commit card */}
              {msg.sharedCommit && !isDeleted && (
                <div
                  onClick={() => onCommitClick?.(msg.sharedCommit.id)}
                  style={{ background: commitCardBg, border: `1px solid ${commitBorder}`, borderRadius: 10, padding: '10px 12px', marginBottom: 4, cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = commitCardHov}
                  onMouseLeave={e => e.currentTarget.style.background = commitCardBg}>
                  <div style={{ fontSize: 10, color: 'oklch(52% 0.2 260)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⎇</span> Shared commit · <span style={{ fontWeight: 400, color: commitSubColor }}>tap to view</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4, color: commitMsgColor }}>{msg.sharedCommit.message}</div>
                  <BranchPill name={msg.sharedCommit.branch} wi={false} merged={false} />
                </div>
              )}

              {/* Reply-to snippet */}
              {msg.replyTo && !isDeleted && (
                <div style={{
                  background: replyBg, borderLeft: `3px solid ${replyBdr}`, borderRadius: '8px 8px 0 0',
                  padding: '5px 10px', marginBottom: -2, maxWidth: '100%',
                  overflow: 'hidden',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: replyBdr, marginBottom: 1 }}>
                    {msg.replyTo.senderId === myId ? 'You' : (otherUser?.fullName || otherUser?.username || 'them')}
                  </div>
                  <div style={{ fontSize: 11.5, color: replyText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.replyTo.text}
                  </div>
                </div>
              )}

              {/* Bubble + action buttons */}
              <div
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, flexDirection: isMe ? 'row-reverse' : 'row', width: '100%', justifyContent: isMe ? 'flex-start' : 'flex-start' }}
                onMouseEnter={() => { if (!isMobile) setHoveredMsgId(msg.id); }}
                onMouseLeave={() => { if (!isMobile) { setHoveredMsgId(null); setPickerMsgId(null); } }}>

                {/* Message bubble */}
                <div style={{ position: 'relative', maxWidth: '100%' }}>
                  {editingMsgId === msg.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        ref={editInputRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitEdit(msg);
                          if (e.key === 'Escape') setEditingMsgId(null);
                        }}
                        style={{ border: `1px solid oklch(52% 0.2 260)`, borderRadius: 14, padding: '7px 12px', fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', background: isDark ? 'oklch(24% 0.012 260)' : 'white', color: isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)', minWidth: 120 }}
                      />
                      <button onClick={() => submitEdit(msg)} style={{ border: 'none', background: 'oklch(52% 0.2 260)', color: 'white', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Save</button>
                      <button onClick={() => setEditingMsgId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: isDark ? 'oklch(58% 0.01 260)' : 'oklch(55% 0.01 260)' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{
                      padding: isDeleted ? '7px 13px' : '8px 13px',
                      borderRadius: (() => {
                        const only = group.messages.length === 1, first = mi === 0, last = mi === group.messages.length - 1;
                        const hasReply = !!msg.replyTo;
                        if (only) return hasReply ? '0 0 16px 16px' : '16px';
                        if (isMe) {
                          if (first) return hasReply ? '0 0 4px 16px' : '16px 16px 4px 16px';
                          if (last) return '16px 4px 16px 16px';
                          return '16px 4px 4px 16px';
                        } else {
                          if (first) return hasReply ? '0 0 16px 4px' : '16px 16px 16px 4px';
                          if (last) return '4px 16px 16px 16px';
                          return '4px 16px 16px 4px';
                        }
                      })(),
                      background: isMe ? 'oklch(52% 0.2 260)' : incomingBg,
                      color: isDeleted ? (isMe ? 'oklch(85% 0.04 260)' : deletedColor) : (isMe ? 'white' : incomingColor),
                      fontSize: 13.5, lineHeight: 1.5,
                      border: isMe ? 'none' : `1px solid ${incomingBorder}`,
                      wordBreak: 'break-word',
                      fontStyle: isDeleted ? 'italic' : 'normal',
                    }}>
                      {isDeleted ? 'Message deleted' : highlight(msg.text, searchQuery)}
                    </div>
                  )}
                  {/* Link preview */}
                  {url && !isDeleted && <LinkPreview url={url} isDark={isDark} isMe={isMe} />}
                  {/* Reaction picker */}
                  {pickerMsgId === msg.id && (
                    <ReactionPicker isDark={isDark} isMe={isMe} onReact={(emoji) => { onReact(msg.id, emoji); setPickerMsgId(null); }} />
                  )}
                </div>

                {/* Hover action buttons */}
                {!isDeleted && editingMsgId !== msg.id && (
                  <div style={{
                    display: 'flex', gap: 3, opacity: isHovered ? 1 : 0,
                    transition: isMobile ? 'none' : 'opacity 0.12s',
                    pointerEvents: isHovered ? 'auto' : 'none',
                    flexShrink: 0,
                  }}>
                    {/* Reply */}
                    <button
                      title="Reply"
                      onClick={() => onReply(msg)}
                      style={{ border: 'none', background: actionBtn, borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? 'oklch(68% 0.01 260)' : 'oklch(52% 0.01 260)' }}
                      onMouseEnter={e => e.currentTarget.style.background = actionBtnHov}
                      onMouseLeave={e => e.currentTarget.style.background = actionBtn}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 2 1 5 4 8" />
                        <path d="M1 5h7a4 4 0 0 1 4 4v2" />
                      </svg>
                    </button>
                    {/* React */}
                    <button
                      title="React"
                      onClick={() => setPickerMsgId(pickerMsgId === msg.id ? null : msg.id)}
                      style={{ border: 'none', background: actionBtn, borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
                      onMouseEnter={e => e.currentTarget.style.background = actionBtnHov}
                      onMouseLeave={e => e.currentTarget.style.background = actionBtn}>
                      😊
                    </button>
                    {/* Edit (own messages only, non-deleted) */}
                    {isMe && (
                      <button
                        title="Edit"
                        onClick={() => startEdit(msg)}
                        style={{ border: 'none', background: actionBtn, borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? 'oklch(68% 0.01 260)' : 'oklch(52% 0.01 260)' }}
                        onMouseEnter={e => e.currentTarget.style.background = actionBtnHov}
                        onMouseLeave={e => e.currentTarget.style.background = actionBtn}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 1.5a1.5 1.5 0 0 1 2 2L3 11 1 11.5 1.5 9.5z" />
                        </svg>
                      </button>
                    )}
                    {/* Delete (own messages only) */}
                    {isMe && (
                      <button
                        title="Delete"
                        onClick={() => onDelete(msg.id)}
                        style={{ border: 'none', background: actionBtn, borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? 'oklch(58% 0.08 20)' : 'oklch(52% 0.12 20)' }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'oklch(28% 0.05 20)' : 'oklch(94% 0.04 20)'}
                        onMouseLeave={e => e.currentTarget.style.background = actionBtn}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1,2.5 11,2.5" />
                          <path d="M3.5 2.5V1.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1" />
                          <rect x="1.5" y="2.5" width="9" height="8" rx="1" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Reactions row */}
              <ReactionRow reactions={msg.reactions} myId={myId} onReact={(emoji) => onReact(msg.id, emoji)} isDark={isDark} isMe={isMe} />
            </div>
          );
        })}

        {/* Timestamp + read receipt */}
        <div style={{ fontSize: 10.5, color: 'oklch(65% 0.01 260)', marginTop: 1, textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
          {fmtMessageTime(group.messages[group.messages.length - 1]?.createdAt)}
          {group.messages[group.messages.length - 1]?.editedAt && (
            <span style={{ color: 'oklch(65% 0.01 260)', fontSize: 10 }}>(edited)</span>
          )}
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

  if (confirming) {
    return (
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${borderCol}`, background: confirmBg }}>
        <div style={{ fontSize: 12, color: isDark ? 'oklch(72% 0.01 260)' : 'oklch(35% 0.01 260)', marginBottom: 8, fontWeight: 500 }}>
          Delete chat with <strong>{cv.otherUser?.fullName || cv.otherUser?.username}</strong>?
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(cv.id); }}
            style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', background: 'oklch(52% 0.18 20)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Delete
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
            style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: `1px solid ${cancelBdr}`, background: cancelBg, color: cancelCol, fontSize: 12, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

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
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [pendingCommit, setPendingCommit] = useState(
    initialCommitId ? { id: initialCommitId, message: initialCommitMsg, branch: initialCommitBranch } : null
  );
  const [mobilePane, setMobilePane] = useState('list');

  // ── In-conversation message search ─────────────────────────────────────────
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState(null); // null = off, [] = results
  const [msgSearchLoading, setMsgSearchLoading] = useState(false);
  const msgSearchTimerRef = useRef(null);

  // ── Reply-to state ──────────────────────────────────────────────────────────
  const [replyTo, setReplyTo] = useState(null); // { id, text, senderId }

  const switchPane = useCallback((pane) => {
    setMobilePane(pane);
    onMobilePaneChange?.(pane);
  }, [onMobilePaneChange]);

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
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, [isMobile, mobilePane]);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef(null);
  const inputValueRef = useRef('');
  const conversationsRef = useRef([]);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv?.otherUser;

  const { data: convsData, isLoading: loadingConvs } = useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: () => api.getConversations(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (convsData) setConversations(convsData.conversations || []);
  }, [convsData]);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

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

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    setMessages([]);
    setReplyTo(null);
    setMsgSearchResults(null);
    setMsgSearchQuery('');
    setShowMsgSearch(false);
    inputRef.current?.focus();
    api.getMessages(activeConvId, { limit: 50 }).then(({ messages: msgs }) => {
      setMessages(msgs || []);
      setHasMore((msgs || []).length === 50);
      socket?.emitMarkRead(activeConvId);
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c));
    }).catch(console.error).finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Socket event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const offMsg = socket.on('new_message', ({ conversationId, message }) => {
      if (message.senderId === user?.id) return;
      if (!conversationsRef.current.find(c => c.id === conversationId)) {
        api.getConversations().then(({ conversations: fresh }) => setConversations(fresh)).catch(() => {});
        return;
      }
      if (conversationId === activeConvId) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        socket.emitMarkRead(conversationId);
      } else {
        setConversations(prev => prev.map(c => {
          if (c.id !== conversationId) return c;
          return { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: { text: message.text, sentAt: message.createdAt, senderId: message.senderId } };
        }));
      }
      setConversations(prev => {
        const updated = prev.map(c => c.id === conversationId
          ? { ...c, lastMessage: { text: message.text, sentAt: message.createdAt, senderId: message.senderId } }
          : c);
        return [...updated].sort((a, b) => {
          const ta = a.lastMessage?.sentAt || a.createdAt;
          const tb = b.lastMessage?.sentAt || b.createdAt;
          return new Date(tb) - new Date(ta);
        });
      });
    });

    const offConvUpdated = socket.on('conversation_updated', () => {
      api.getConversations().then(({ conversations: fresh }) => setConversations(fresh)).catch(() => {});
    });

    const offSaved = socket.on('message_saved', ({ tempId, message }) => {
      setMessages(prev => prev.map(m => m.id === tempId ? message : m));
    });

    const offFailed = socket.on('message_failed', ({ tempId }) => {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    });

    const offRead = socket.on('messages_read', ({ conversationId, readBy }) => {
      if (conversationId === activeConvId && readBy !== user?.id) {
        setMessages(prev => prev.map(m => m.senderId === user?.id && !m.readBy.includes(readBy)
          ? { ...m, readBy: [...m.readBy, readBy] } : m));
      }
    });

    // Real-time message updates (edit, delete, reaction)
    const offUpdated = socket.on('message_updated', ({ message }) => {
      setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    });

    return () => { offMsg?.(); offRead?.(); offSaved?.(); offFailed?.(); offConvUpdated?.(); offUpdated?.(); };
  }, [socket, activeConvId, user]);

  useEffect(() => {
    if (!socket || conversations.length === 0) return;
    const ids = conversations.map(c => c.otherUser?.id).filter(Boolean);
    socket.queryOnlineUsers(ids).then(() => {}).catch(() => {});
  }, [socket, conversations]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendingRef = useRef(false);
  const activeConvIdRef = useRef(activeConvId);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);
  const pendingCommitRef = useRef(pendingCommit);
  useEffect(() => { pendingCommitRef.current = pendingCommit; }, [pendingCommit]);
  const replyToRef = useRef(replyTo);
  useEffect(() => { replyToRef.current = replyTo; }, [replyTo]);

  const send = useCallback(async () => {
    const text = (inputRef.current?.value ?? inputValueRef.current).trim();
    const convId = activeConvIdRef.current;
    const sharedCommit = pendingCommitRef.current || undefined;
    const replyToData = replyToRef.current || null;
    if ((!text && !sharedCommit) || !convId || sendingRef.current) return;
    inputValueRef.current = '';
    if (inputRef.current) inputRef.current.value = '';
    setInput('');
    setPendingCommit(null);
    setReplyTo(null);
    sendingRef.current = true;
    setSending(true);

    if (isTypingRef.current) {
      socket?.emitTypingStop(convId);
      isTypingRef.current = false;
    }
    clearTimeout(typingTimerRef.current);

    const optimistic = {
      id: `opt_${Date.now()}`,
      conversationId: convId,
      senderId: user.id,
      text,
      sharedCommit: sharedCommit || null,
      replyTo: replyToData,
      reactions: {},
      readBy: [user.id],
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    sendingRef.current = false;
    setSending(false);

    const participants = activeConv?.participants || [user.id, otherUser?.id].filter(Boolean);

    socket?.sendMessage({ conversationId: convId, text, sharedCommit, replyTo: replyToData, participants }).catch(async () => {
      try {
        const res = await api.sendMessageREST(convId, text, sharedCommit);
        if (res?.message) setMessages(prev => prev.map(m => m.id === optimistic.id ? res.message : m));
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

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || !activeConvId || messages.length === 0) return;
    const oldest = messages[0]?.createdAt;
    try {
      const { messages: older } = await api.getMessages(activeConvId, { limit: 50, before: oldest });
      setMessages(prev => [...(older || []), ...prev]);
      setHasMore((older || []).length === 50);
    } catch {}
  }, [hasMore, activeConvId, messages]);

  // ── Delete conversation ───────────────────────────────────────────────────
  const handleDeleteConv = useCallback(async (convId) => {
    try {
      await api.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) setActiveConvId(null);
    } catch (err) { console.error('Failed to delete conversation', err); }
  }, [activeConvId]);

  // ── Delete message ────────────────────────────────────────────────────────
  const handleDeleteMessage = useCallback(async (msgId) => {
    try {
      const { message } = await api.deleteMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? message : m));
    } catch (err) { console.error('Failed to delete message', err); }
  }, []);

  // ── Edit message ──────────────────────────────────────────────────────────
  const handleEditMessage = useCallback(async (msgId, newText) => {
    try {
      const { message } = await api.editMessage(msgId, newText);
      setMessages(prev => prev.map(m => m.id === msgId ? message : m));
    } catch (err) { console.error('Failed to edit message', err); }
  }, []);

  // ── React to message ──────────────────────────────────────────────────────
  const handleReact = useCallback(async (msgId, emoji) => {
    try {
      const { message } = await api.reactToMessage(msgId, emoji);
      setMessages(prev => prev.map(m => m.id === msgId ? message : m));
    } catch (err) { console.error('Failed to react', err); }
  }, []);

  // ── Start new conversation ────────────────────────────────────────────────
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
    } catch (err) { console.error('Failed to start conversation', err); }
  }, [socket]);

  // ── In-conversation message search ────────────────────────────────────────
  useEffect(() => {
    clearTimeout(msgSearchTimerRef.current);
    if (!msgSearchQuery.trim() || !activeConvId) {
      setMsgSearchResults(null);
      return;
    }
    setMsgSearchLoading(true);
    msgSearchTimerRef.current = setTimeout(async () => {
      try {
        const { messages: results } = await api.searchMessages(activeConvId, msgSearchQuery.trim());
        setMsgSearchResults(results || []);
      } catch { setMsgSearchResults([]); }
      setMsgSearchLoading(false);
    }, 300);
    return () => clearTimeout(msgSearchTimerRef.current);
  }, [msgSearchQuery, activeConvId]);

  // ── Group messages by sender + minute ─────────────────────────────────────
  const displayMessages = msgSearchResults !== null ? msgSearchResults : messages;

  const messageGroups = useMemo(() => {
    const groups = [];
    displayMessages.forEach(msg => {
      const last = groups[groups.length - 1];
      const msgMinute = msg.createdAt?.slice(0, 16);
      const lastMinute = last?.messages[0]?.createdAt?.slice(0, 16);
      if (last && last.senderId === msg.senderId && msgMinute === lastMinute && !msg.replyTo) {
        last.messages.push(msg);
      } else {
        groups.push({ senderId: msg.senderId, senderUser: msg.senderId === user?.id ? user : otherUser, messages: [msg] });
      }
    });
    return groups;
  }, [displayMessages, user, otherUser]);

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

  // ── Theme colors for chat area ─────────────────────────────────────────────
  const chatBg        = isDark ? 'oklch(15% 0.01 260)'  : 'oklch(98.5% 0.003 80)';
  const headerBg      = isDark ? 'oklch(18% 0.01 260)'  : 'white';
  const headerBdr     = isDark ? 'oklch(26% 0.01 260)'  : 'oklch(91% 0.006 80)';
  const inputBarBg    = isDark ? 'oklch(18% 0.01 260)'  : 'white';
  const inputBarBdr   = isDark ? 'oklch(26% 0.01 260)'  : 'oklch(91% 0.006 80)';
  const inputFieldBg  = isDark ? 'oklch(22% 0.01 260)'  : 'oklch(98.5% 0.005 80)';
  const inputFieldBdr = isDark ? 'oklch(30% 0.012 260)' : 'oklch(88% 0.008 260)';
  const inputTextColor = isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)';
  const headerTextPri = isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)';
  const textMuted     = isDark ? 'oklch(58% 0.01 260)'  : 'oklch(60% 0.01 260)';
  const typingBg      = isDark ? 'oklch(26% 0.012 260)' : 'white';
  const typingBdr     = isDark ? 'oklch(32% 0.012 260)' : 'oklch(91% 0.006 80)';
  const pendingBg     = isDark ? 'oklch(22% 0.018 260)' : 'oklch(97% 0.012 260)';
  const pendingBdr    = isDark ? 'oklch(32% 0.02 260)'  : 'oklch(88% 0.015 260)';
  const pendingMsg    = isDark ? 'oklch(90% 0.008 260)' : 'oklch(18% 0.015 260)';
  const dotBorderChat = isDark ? 'oklch(15% 0.01 260)'  : 'oklch(98.5% 0.003 80)';
  const sendInactiveBg = isDark ? 'oklch(28% 0.01 260)' : 'oklch(88% 0.005 260)';
  const replyBannerBg = isDark ? 'oklch(22% 0.018 260)' : 'oklch(96% 0.012 260)';
  const replyBannerBdr = isDark ? 'oklch(36% 0.05 260)' : 'oklch(72% 0.1 260)';
  const searchBarBg   = isDark ? 'oklch(20% 0.01 260)'  : 'oklch(97% 0.006 80)';

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
            <button onClick={() => setShowNewChat(true)} title="New message"
              style={{ border: 'none', background: isDark ? 'oklch(26% 0.02 260)' : 'oklch(95% 0.015 260)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: isDark ? 'oklch(72% 0.15 260)' : 'oklch(45% 0.15 260)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="7" y1="2" x2="7" y2="12" /><line x1="2" y1="7" x2="12" y2="7" />
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
          {loadingConvs && <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: isDark ? 'oklch(55% 0.01 260)' : 'oklch(60% 0.01 260)' }}>Loading…</div>}
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
            <ConvRow key={cv.id} cv={cv} isActive={cv.id === activeConvId}
              isOnline={!!socket?.onlineUsers?.[cv.otherUser?.id]}
              onSelect={() => { setActiveConvId(cv.id); switchPane('chat'); }}
              onDelete={handleDeleteConv} onProfile={onProfile}
              isMobile={isMobile} isDark={isDark} />
          ))}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────────── */}
      <div
        ref={isMobile && mobilePane === 'chat' ? chatPaneRef : undefined}
        style={isMobile && mobilePane === 'chat'
          ? { position: 'fixed', left: 0, right: 0, top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: chatBg, zIndex: 50 }
          : { flex: 1, display: showChat ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden', background: chatBg, minWidth: 0 }}>

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
                <button onClick={() => switchPane('list')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', color: 'oklch(42% 0.2 260)', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="12 4 6 10 12 16" />
                  </svg>
                </button>
              )}
              <div onClick={() => onProfile && otherUser?.id && onProfile(otherUser.id)} style={{ cursor: onProfile && otherUser?.id ? 'pointer' : 'default' }}>
                <Avatar user={otherUser} size={36} showOnline isOnline={isOtherOnline} dotBorder={headerBg} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
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
              {/* Search icon button */}
              <button
                title="Search messages"
                onClick={() => { setShowMsgSearch(s => !s); setMsgSearchQuery(''); setMsgSearchResults(null); }}
                style={{ border: 'none', background: showMsgSearch ? (isDark ? 'oklch(30% 0.02 260)' : 'oklch(93% 0.01 260)') : 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: showMsgSearch ? 'oklch(52% 0.2 260)' : (isDark ? 'oklch(62% 0.01 260)' : 'oklch(55% 0.01 260)'), transition: 'background 0.12s' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="6.5" cy="6.5" r="4.5" /><line x1="10" y1="10" x2="13.5" y2="13.5" />
                </svg>
              </button>
            </div>

            {/* In-conversation search bar */}
            {showMsgSearch && (
              <div style={{ flexShrink: 0, padding: '8px 16px', borderBottom: `1px solid ${headerBdr}`, background: searchBarBg, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={textMuted} strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
                </svg>
                <input
                  autoFocus
                  value={msgSearchQuery}
                  onChange={e => setMsgSearchQuery(e.target.value)}
                  placeholder="Search in conversation…"
                  style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: inputTextColor }}
                />
                {msgSearchLoading && <span style={{ fontSize: 11, color: textMuted }}>Searching…</span>}
                {msgSearchResults !== null && !msgSearchLoading && (
                  <span style={{ fontSize: 11, color: textMuted }}>{msgSearchResults.length} result{msgSearchResults.length !== 1 ? 's' : ''}</span>
                )}
                {msgSearchQuery && (
                  <button onClick={() => { setMsgSearchQuery(''); setMsgSearchResults(null); }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: textMuted, fontSize: 13, lineHeight: 1 }}>✕</button>
                )}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 12px' : 'clamp(16px, 2.5vw, 32px) clamp(20px, 3vw, 48px)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {!showMsgSearch && hasMore && (
                <button onClick={loadMore}
                  style={{ alignSelf: 'center', border: `1px solid ${isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)'}`, background: isDark ? 'oklch(22% 0.012 260)' : 'white', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: isDark ? 'oklch(72% 0.15 260)' : 'oklch(45% 0.15 260)', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Load older messages
                </button>
              )}
              {loadingMsgs && <div style={{ textAlign: 'center', padding: 20, color: textMuted, fontSize: 13 }}>Loading messages…</div>}
              {!loadingMsgs && messages.length === 0 && !showMsgSearch && (
                <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>👋</div>
                  <div style={{ fontSize: 13 }}>Say hello to {otherUser?.fullName || otherUser?.username}!</div>
                </div>
              )}
              {showMsgSearch && msgSearchResults !== null && msgSearchResults.length === 0 && !msgSearchLoading && (
                <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 13 }}>No messages matching "{msgSearchQuery}"</div>
                </div>
              )}
              {messageGroups.map((group, gi) => {
                const isMe = group.senderId === user?.id;
                const lastMsg = group.messages[group.messages.length - 1];
                const readByOther = isMe && lastMsg?.readBy?.includes(otherUser?.id);
                return (
                  <MessageGroup
                    key={gi}
                    group={group}
                    isMe={isMe}
                    readByOther={readByOther}
                    isMobile={isMobile}
                    onCommitClick={id => navigate(`/feed?post=${id}`)}
                    isDark={isDark}
                    myId={user?.id}
                    otherUser={otherUser}
                    onReact={handleReact}
                    onDelete={handleDeleteMessage}
                    onEdit={handleEditMessage}
                    onReply={(msg) => setReplyTo({ id: msg.id, text: msg.text, senderId: msg.senderId })}
                    searchQuery={showMsgSearch ? msgSearchQuery : ''}
                  />
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

              {/* Pending commit preview */}
              {pendingCommit && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: pendingBg, border: `1px solid ${pendingBdr}`, borderRadius: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'oklch(52% 0.2 260)', fontWeight: 600, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>⎇</span> Sharing commit
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: pendingMsg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{pendingCommit.message}</div>
                    <BranchPill name={pendingCommit.branch} wi={false} merged={false} />
                  </div>
                  <button onClick={() => setPendingCommit(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: isDark ? 'oklch(58% 0.01 260)' : 'oklch(55% 0.01 260)', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</button>
                </div>
              )}

              {/* Reply-to preview */}
              {replyTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: replyBannerBg, borderLeft: `3px solid ${replyBannerBdr}`, borderRadius: '0 8px 8px 0' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: replyBannerBdr, marginBottom: 1 }}>
                      Replying to {replyTo.senderId === user?.id ? 'yourself' : (otherUser?.fullName || otherUser?.username)}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? 'oklch(68% 0.01 260)' : 'oklch(52% 0.01 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {replyTo.text}
                    </div>
                  </div>
                  <button onClick={() => setReplyTo(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: isDark ? 'oklch(58% 0.01 260)' : 'oklch(55% 0.01 260)', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</button>
                </div>
              )}

              {/* Text input row */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, border: `1px solid ${inputFieldBdr}`, borderRadius: 22, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, background: inputFieldBg }}>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder={replyTo ? `Reply to ${replyTo.senderId === user?.id ? 'yourself' : (otherUser?.fullName || otherUser?.username)}…` : 'Send a message…'}
                    style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", color: inputTextColor, minWidth: 0 }}
                  />
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
                    <line x1="8" y1="13" x2="8" y2="3" /><polyline points="4 7 8 3 12 7" />
                  </svg>
                </button>
              </div>
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
