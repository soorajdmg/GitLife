import { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';
import BranchPill from './BranchPill';
import Tag from './Tag';
import EngagementBar from './EngagementBar';
import CommentThread from './CommentThread';
import BlameBadge from './BlameBadge';
import { api } from '../../config/api';
import { useTheme } from '../../contexts/ThemeContext';

function SendCommitDMModal({ commit, currentUserId, onClose, onSend, isDark }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const dm = {
    bg:        isDark ? 'oklch(18% 0.01 260)'  : 'white',
    border:    isDark ? 'oklch(28% 0.012 260)' : 'oklch(91% 0.006 80)',
    borderSub: isDark ? 'oklch(25% 0.01 260)'  : 'oklch(93% 0.004 80)',
    borderSub2:isDark ? 'oklch(25% 0.01 260)'  : 'oklch(94% 0.004 80)',
    textPri:   isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)',
    textSec:   isDark ? 'oklch(65% 0.01 260)'  : 'oklch(55% 0.01 260)',
    textMuted: isDark ? 'oklch(52% 0.01 260)'  : 'oklch(58% 0.01 260)',
    previewBg: isDark ? 'oklch(22% 0.04 260)'  : 'oklch(97.5% 0.01 260)',
    searchBg:  isDark ? 'oklch(22% 0.01 260)'  : 'oklch(97.5% 0.006 260)',
    searchBdr: isDark ? 'oklch(30% 0.012 260)' : 'oklch(90% 0.008 260)',
    closeBg:   isDark ? 'oklch(25% 0.01 260)'  : 'oklch(95% 0.006 80)',
    rowHover:  isDark ? 'oklch(22% 0.04 260)'  : 'oklch(96.5% 0.01 260)',
    rowDivider:isDark ? 'oklch(23% 0.01 260)'  : 'oklch(96.5% 0.003 80)',
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
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'oklch(20% 0.03 260 / 0.45)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
    >
      <div style={{ background: dm.bg, borderRadius: 16, width: 400, maxHeight: 520, display: 'flex', flexDirection: 'column', boxShadow: isDark ? '0 8px 48px oklch(5% 0.01 260 / 0.6)' : '0 8px 48px oklch(25% 0.05 260 / 0.18)', border: `1px solid ${dm.border}` }}>
        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${dm.borderSub}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: dm.textPri }}>Send commit in DM</div>
          <button onClick={onClose} style={{ border: 'none', background: dm.closeBg, borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dm.textMuted, fontSize: 14 }}>✕</button>
        </div>

        {/* Commit preview */}
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${dm.borderSub2}`, background: dm.previewBg }}>
          <div style={{ fontSize: 10, color: 'oklch(52% 0.2 260)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⎇</span> Sharing commit
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: dm.textPri, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{commit.message}</div>
          <BranchPill name={commit.branch} wi={false} merged={false} />
        </div>

        {/* Search */}
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${dm.borderSub2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: dm.searchBg, border: `1px solid ${dm.searchBdr}`, borderRadius: 10, padding: '8px 12px' }}
            onFocusCapture={e => e.currentTarget.style.border = '1px solid oklch(72% 0.12 260)'}
            onBlurCapture={e => e.currentTarget.style.border = `1px solid ${dm.searchBdr}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={dm.textMuted} strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="12.5" y2="12.5" /></svg>
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or @username…"
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: dm.textPri }}
            />
            {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: dm.textMuted, fontSize: 13 }}>✕</button>}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!query.trim() && results.length > 0 && (
            <div style={{ padding: '8px 18px 4px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: dm.textMuted }}>Suggested</div>
          )}
          {loading && <div style={{ padding: '20px 18px', fontSize: 13, color: dm.textMuted, textAlign: 'center' }}>Searching…</div>}
          {!loading && results.length === 0 && query.trim() && (
            <div style={{ padding: '28px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: dm.textSec, marginBottom: 4 }}>No users found</div>
              <div style={{ fontSize: 12, color: dm.textMuted }}>Try a different name or username</div>
            </div>
          )}
          {!loading && results.map(u => {
            const ini = (u.fullName || u.username || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div
                key={u.id}
                onClick={() => onSend(u)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', borderBottom: `1px solid ${dm.rowDivider}`, transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = dm.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                  {u.avatarUrl ? <img src={u.avatarUrl} alt={ini} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: dm.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName || u.username}</div>
                  <div style={{ fontSize: 11.5, color: dm.textSec, fontFamily: "'JetBrains Mono', monospace" }}>@{u.username}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderMentions(text, onProfile) {
  if (!text || !onProfile) return text;
  const parts = text.split(/(@[\w.]+)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (/^@[\w.]+$/.test(part)) {
      const username = part.slice(1);
      return (
        <span
          key={i}
          onClick={e => { e.stopPropagation(); onProfile(username); }}
          style={{ color: 'oklch(42% 0.2 260)', fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >{part}</span>
      );
    }
    return part;
  });
}

function userColor(userId) {
  const colors = [
    'oklch(52% 0.2 260)', 'oklch(56% 0.2 330)', 'oklch(50% 0.18 155)',
    'oklch(60% 0.19 55)', 'oklch(52% 0.18 200)', 'oklch(58% 0.2 40)',
    'oklch(50% 0.18 230)', 'oklch(52% 0.18 160)',
  ];
  if (!userId) return colors[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function CommitCard({ c, onReact, onFork, onMerge, onStash, onDelete, compact, currentUser, openMessage, onProfile }) {
  const { isDark } = useTheme();
  const isOwnPost = currentUser && (currentUser.id === c.userId || currentUser._id === c.userId);

  // Resolve author info from userInfo (populated by backend) or fallback to currentUser
  const userInfo = c.userInfo || {};
  const authorName   = userInfo.fullName || userInfo.username || c.fullName || c.username || (isOwnPost ? (currentUser.fullName || currentUser.username) : null) || 'User';
  const authorHandle = userInfo.username || c.username || (isOwnPost ? currentUser.username : null) || 'user';
  const authorAvatar = userInfo.avatarUrl || c.avatarUrl || (isOwnPost ? currentUser.avatarUrl : null);

  const user = {
    name: authorName,
    handle: `@${authorHandle}`,
    ini: authorName.slice(0, 2).toUpperCase(),
    color: userColor(c.userId),
    avatarUrl: authorAvatar,
  };

  const [bodyOpen, setBodyOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(c.commentCount ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const menuRef = useRef();
  const [blameStatus, setBlameStatus] = useState(c.blameStatus || null);
  const [blameFormOpen, setBlameFormOpen] = useState(false);
  const [blameNote, setBlameNote] = useState(c.blameNote || '');
  const [savingBlame, setSavingBlame] = useState(false);

  const handleCountChange = (delta) => setLocalCommentCount(p => Math.max(0, p + delta));

  const handleShare = () => {
    if (!isOwnPost && openMessage) setDmModalOpen(true);
  };

  const handleDMSend = (targetUser) => {
    setDmModalOpen(false);
    openMessage(targetUser.id, { id: c.id, message: c.message, branch: c.branch });
  };

  const handleBlameStatus = async (status) => {
    setSavingBlame(true);
    try {
      await api.setDecisionBlame(c.id, status, blameNote || null);
      setBlameStatus(status);
      setBlameFormOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBlame(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const cardBg = c.wi
    ? (isDark ? 'oklch(19% 0.015 55)' : 'oklch(99.5% 0.012 65)')
    : (isDark ? 'oklch(18% 0.01 260)' : 'white');
  const cardBorder = c.wi
    ? (isDark ? 'oklch(32% 0.08 55)' : 'oklch(88% 0.1 60)')
    : (isDark ? 'oklch(26% 0.01 260)' : 'oklch(91% 0.006 80)');
  const textPri  = isDark ? 'oklch(92% 0.008 260)' : (c.wi ? 'oklch(42% 0.18 55)' : 'oklch(15% 0.015 260)');
  const textSec  = isDark ? 'oklch(65% 0.01 260)'  : 'oklch(58% 0.01 260)';
  const textBody = isDark ? 'oklch(72% 0.01 260)'  : 'oklch(44% 0.01 260)';
  const menuBg    = isDark ? 'oklch(21% 0.012 260)' : 'white';
  const menuBorder= isDark ? 'oklch(30% 0.012 260)' : 'oklch(91% 0.006 80)';
  const menuDivider = isDark ? 'oklch(28% 0.01 260)' : 'oklch(94% 0.004 80)';
  const menuText  = isDark ? 'oklch(78% 0.008 260)' : 'oklch(50% 0.01 260)';
  const menuHover = isDark ? 'oklch(25% 0.012 260)' : undefined;

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 14, padding: compact ? '14px 16px' : '18px 20px',
        marginBottom: 10, transition: 'box-shadow 0.15s', position: 'relative',
        boxShadow: blameStatus === 'broken' ? 'inset 3px 0 0 oklch(60% 0.18 30)' : undefined,
      }}
      onMouseEnter={e => { const inset = blameStatus === 'broken' ? 'inset 3px 0 0 oklch(60% 0.18 30), ' : ''; e.currentTarget.style.boxShadow = inset + (isDark ? '0 2px 16px oklch(5% 0.01 260 / 0.4)' : '0 2px 16px oklch(70% 0.01 260 / 0.1)'); setHovered(true); }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = blameStatus === 'broken' ? 'inset 3px 0 0 oklch(60% 0.18 30)' : 'none'; setHovered(false); }}
    >
      {c.wi && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: isDark ? 'oklch(65% 0.15 55)' : 'oklch(48% 0.19 55)', fontWeight: 500, marginBottom: 8 }}>⎇ what-if branch</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div onClick={() => onProfile && (c.userInfo?.username || c.userId) && onProfile(c.userInfo?.username || c.userId)} style={{ cursor: onProfile && (c.userInfo?.username || c.userId) ? 'pointer' : 'default', flexShrink: 0 }}>
          <Avatar u={user} size={compact ? 32 : 36} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            onClick={() => onProfile && (c.userInfo?.username || c.userId) && onProfile(c.userInfo?.username || c.userId)}
            style={{ fontSize: 14, fontWeight: 600, cursor: onProfile && (c.userInfo?.username || c.userId) ? 'pointer' : 'default', display: 'inline-block' }}
            onMouseEnter={e => { if (onProfile && (c.userInfo?.username || c.userId)) e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
          >{user.name}</div>
          <div style={{ fontSize: 12, color: textSec, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{user.handle}</span><span>·</span><span>{c.ts}</span>
          </div>
        </div>
        <BranchPill name={c.branch} wi={c.wi} merged={false} />
        {/* Forked-from attribution */}
        {c.forkedFrom?.username && (
          <span
            onClick={e => { e.stopPropagation(); onProfile?.(c.forkedFrom.username); }}
            title={`Inspired by @${c.forkedFrom.username}`}
            style={{
              fontSize: 10.5, color: 'oklch(52% 0.2 260)', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 20,
              background: 'oklch(95% 0.015 260)',
              border: '1px solid oklch(85% 0.025 260)',
            }}
          >
            ⎇ inspired by @{c.forkedFrom.username}
          </span>
        )}
        {/* Three-dot menu — author only, shown on hover */}
        {isOwnPost && onDelete && (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
              title="More options"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: menuOpen ? 'oklch(93% 0.006 260)' : 'transparent',
                color: 'oklch(55% 0.01 260)', cursor: 'pointer', padding: 0,
                opacity: hovered || menuOpen ? 1 : 0,
                transition: 'opacity 0.15s, background 0.12s',
                flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="7" cy="2.5" r="1.2" /><circle cx="7" cy="7" r="1.2" /><circle cx="7" cy="11.5" r="1.2" />
              </svg>
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: menuBg, border: `1px solid ${menuBorder}`, borderRadius: 10, boxShadow: isDark ? '0 4px 20px oklch(5% 0.01 260 / 0.5)' : '0 4px 20px oklch(25% 0.05 260 / 0.12)', zIndex: 200, overflow: 'hidden', minWidth: 160 }}>
                {/* Blame options */}
                {!blameStatus && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); setBlameFormOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(65% 0.18 30)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'oklch(24% 0.02 30)' : 'oklch(97% 0.01 30)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ⚠ Mark as broken
                  </button>
                )}
                {blameStatus === 'broken' && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); handleBlameStatus('resolved'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: isDark ? 'oklch(65% 0.18 155)' : 'oklch(42% 0.18 155)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'oklch(22% 0.02 155)' : 'oklch(97% 0.01 155)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ✓ Mark as resolved
                  </button>
                )}
                {blameStatus && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); handleBlameStatus(null); setBlameNote(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: menuText, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = menuHover || 'oklch(97% 0.005 260)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ✕ Clear blame
                  </button>
                )}
                <div style={{ margin: '4px 12px', borderTop: `1px solid ${menuDivider}` }} />
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(c.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: isDark ? 'oklch(65% 0.2 25)' : 'oklch(45% 0.2 25)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'oklch(22% 0.02 25)' : 'oklch(97% 0.01 25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M5.5 6v4.5M8.5 6v4.5M3.5 3.5l.5 8a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-8" />
                  </svg>
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      <div
        style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: c.body ? 6 : 10, color: textPri, cursor: c.body ? 'pointer' : 'default' }}
        onClick={() => c.body && setBodyOpen(p => !p)}
      >
        {c.message}
      </div>

      {c.body && (bodyOpen || c.body.length < 90) && (
        <div style={{ fontSize: 13.5, color: textBody, lineHeight: 1.65, marginBottom: 10 }}>{renderMentions(c.body, onProfile)}</div>
      )}
      {c.body && c.body.length >= 90 && !bodyOpen && (
        <div style={{ fontSize: 12, color: 'oklch(52% 0.2 260)', marginBottom: 8, marginTop: -2, cursor: 'pointer' }} onClick={() => setBodyOpen(true)}>Read more</div>
      )}

      {/* Image */}
      {(c.image || c.img) && (
        <div style={{ margin: '10px 0', borderRadius: 10, overflow: 'hidden', maxHeight: 220 }}>
          <img src={c.image || c.img} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 }} onError={e => e.target.style.display = 'none'} />
        </div>
      )}

      {/* Tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: blameFormOpen ? 8 : 12, flexWrap: 'wrap' }}>
        <Tag cat={c.category} />
        {c.impact != null && (
          <span style={{ fontSize: 11, color: isDark ? 'oklch(65% 0.01 260)' : 'oklch(52% 0.01 260)', background: isDark ? 'oklch(24% 0.01 260)' : 'oklch(95% 0.006 80)', border: `1px solid ${isDark ? 'oklch(30% 0.01 260)' : 'oklch(90% 0.006 80)'}`, borderRadius: 6, padding: '2px 7px', fontWeight: 500 }}>
            impact {c.impact}
          </span>
        )}
        {blameStatus && <BlameBadge status={blameStatus} />}
      </div>

      {/* Inline blame form */}
      {blameFormOpen && (
        <div style={{ marginBottom: 12, padding: '10px 12px', background: isDark ? 'oklch(20% 0.015 30)' : 'oklch(98% 0.008 30)', borderRadius: 8, border: `1px solid ${isDark ? 'oklch(32% 0.05 30)' : 'oklch(90% 0.05 30)'}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? 'oklch(65% 0.18 30)' : 'oklch(45% 0.18 30)', marginBottom: 6 }}>⚠ What went wrong?</div>
          <textarea
            value={blameNote}
            onChange={e => setBlameNote(e.target.value)}
            placeholder="Optional: describe what this decision led to…"
            rows={2}
            style={{ width: '100%', padding: '7px 9px', border: `1px solid ${isDark ? 'oklch(34% 0.05 30)' : 'oklch(88% 0.05 30)'}`, borderRadius: 6, fontSize: 12.5, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif", color: isDark ? 'oklch(82% 0.008 260)' : 'oklch(22% 0.015 260)', boxSizing: 'border-box', outline: 'none', background: isDark ? 'oklch(22% 0.012 30)' : 'white' }}
            onFocus={e => e.target.style.borderColor = 'oklch(62% 0.18 30)'}
            onBlur={e => e.target.style.borderColor = isDark ? 'oklch(34% 0.05 30)' : 'oklch(88% 0.05 30)'}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
            <button
              disabled={savingBlame}
              onClick={() => handleBlameStatus('broken')}
              style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: 'oklch(60% 0.18 30)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {savingBlame ? 'Saving…' : 'Mark as broken'}
            </button>
            <button
              onClick={() => setBlameFormOpen(false)}
              style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${isDark ? 'oklch(30% 0.01 260)' : 'oklch(88% 0.008 260)'}`, background: isDark ? 'oklch(24% 0.012 260)' : 'white', fontSize: 12, color: isDark ? 'oklch(68% 0.01 260)' : 'oklch(48% 0.01 260)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Merge convergence indicator */}
      {c.mergedWith?.length > 0 && (
        <div style={{ fontSize: 11, color: 'oklch(42% 0.2 260)', display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 6 }}>
          <span style={{ fontSize: 12 }}>⇄</span>
          {c.mergedWith.length} {c.mergedWith.length === 1 ? 'person' : 'people'} took this same path
        </div>
      )}

      {/* Engagement bar */}
      <EngagementBar
        commitId={c.id}
        reactions={c.rx}
        userReactions={c.ur}
        commentCount={localCommentCount}
        isStashed={c.stashed}
        isAuthor={isOwnPost}
        isFork={!!c.forkedFrom}
        viewCount={c.viewCount}
        onReact={onReact}
        onFork={onFork}
        onMerge={onMerge}
        onReplyClick={() => setReplyOpen(p => !p)}
        onStash={onStash}
        onShare={isOwnPost ? null : handleShare}
        compact={compact}
      />

      {/* Comment thread (toggled) */}
      {replyOpen && (
        <CommentThread
          decisionId={c.id}
          currentUserId={currentUser?.id || currentUser?._id}
          initialCount={localCommentCount}
          onCountChange={handleCountChange}
          onProfile={onProfile}
        />
      )}

      {/* DM recipient picker */}
      {dmModalOpen && (
        <SendCommitDMModal
          commit={{ id: c.id, message: c.message, branch: c.branch }}
          currentUserId={currentUser?.id || currentUser?._id}
          onClose={() => setDmModalOpen(false)}
          onSend={handleDMSend}
          isDark={isDark}
        />
      )}
    </div>
  );
}
