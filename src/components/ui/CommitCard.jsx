import { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';
import BranchPill from './BranchPill';
import Tag from './Tag';
import EngagementBar from './EngagementBar';
import CommentThread from './CommentThread';
import BlameBadge from './BlameBadge';
import { api } from '../../config/api';

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

export default function CommitCard({ c, onReact, onStash, onDelete, compact, currentUser, openMessage, onProfile }) {
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
  const menuRef = useRef();
  const [blameStatus, setBlameStatus] = useState(c.blameStatus || null);
  const [blameFormOpen, setBlameFormOpen] = useState(false);
  const [blameNote, setBlameNote] = useState(c.blameNote || '');
  const [savingBlame, setSavingBlame] = useState(false);

  const handleCountChange = (delta) => setLocalCommentCount(p => Math.max(0, p + delta));

  const handleShare = () => {
    if (!isOwnPost && openMessage && c.userId) openMessage(c.userId);
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

  return (
    <div
      style={{
        background: c.wi ? 'oklch(99.5% 0.012 65)' : 'white',
        border: `1px solid ${c.wi ? 'oklch(88% 0.1 60)' : 'oklch(91% 0.006 80)'}`,
        borderRadius: 14, padding: compact ? '14px 16px' : '18px 20px',
        marginBottom: 10, transition: 'box-shadow 0.15s', position: 'relative',
        borderLeft: blameStatus === 'broken' ? '3px solid oklch(60% 0.18 30)' : undefined,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 16px oklch(70% 0.01 260 / 0.1)'; setHovered(true); }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; setHovered(false); }}
    >
      {c.wi && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'oklch(48% 0.19 55)', fontWeight: 500, marginBottom: 8 }}>⎇ what-if branch</div>}

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
          <div style={{ fontSize: 12, color: 'oklch(58% 0.01 260)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{user.handle}</span><span>·</span><span>{c.ts}</span>
          </div>
        </div>
        <BranchPill name={c.branch} wi={c.wi} merged={false} />
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
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'white', border: '1px solid oklch(91% 0.006 80)', borderRadius: 10, boxShadow: '0 4px 20px oklch(25% 0.05 260 / 0.12)', zIndex: 200, overflow: 'hidden', minWidth: 160 }}>
                {/* Blame options */}
                {!blameStatus && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); setBlameFormOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(45% 0.18 30)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.01 30)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ⚠ Mark as broken
                  </button>
                )}
                {blameStatus === 'broken' && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); handleBlameStatus('resolved'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(42% 0.18 155)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.01 155)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ✓ Mark as resolved
                  </button>
                )}
                {blameStatus && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); handleBlameStatus(null); setBlameNote(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(50% 0.01 260)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.005 260)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ✕ Clear blame
                  </button>
                )}
                <div style={{ margin: '4px 12px', borderTop: '1px solid oklch(94% 0.004 80)' }} />
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(c.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(45% 0.2 25)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.01 25)'}
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
        style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: c.body ? 6 : 10, color: c.wi ? 'oklch(42% 0.18 55)' : 'oklch(15% 0.015 260)', cursor: c.body ? 'pointer' : 'default' }}
        onClick={() => c.body && setBodyOpen(p => !p)}
      >
        {c.message}
      </div>

      {c.body && (bodyOpen || c.body.length < 90) && (
        <div style={{ fontSize: 13.5, color: 'oklch(44% 0.01 260)', lineHeight: 1.65, marginBottom: 10 }}>{c.body}</div>
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
          <span style={{ fontSize: 11, color: 'oklch(52% 0.01 260)', background: 'oklch(95% 0.006 80)', border: '1px solid oklch(90% 0.006 80)', borderRadius: 6, padding: '2px 7px', fontWeight: 500 }}>
            impact {c.impact}
          </span>
        )}
        {blameStatus && <BlameBadge status={blameStatus} />}
      </div>

      {/* Inline blame form */}
      {blameFormOpen && (
        <div style={{ marginBottom: 12, padding: '10px 12px', background: 'oklch(98% 0.008 30)', borderRadius: 8, border: '1px solid oklch(90% 0.05 30)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'oklch(45% 0.18 30)', marginBottom: 6 }}>⚠ What went wrong?</div>
          <textarea
            value={blameNote}
            onChange={e => setBlameNote(e.target.value)}
            placeholder="Optional: describe what this decision led to…"
            rows={2}
            style={{ width: '100%', padding: '7px 9px', border: '1px solid oklch(88% 0.05 30)', borderRadius: 6, fontSize: 12.5, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(22% 0.015 260)', boxSizing: 'border-box', outline: 'none', background: 'white' }}
            onFocus={e => e.target.style.borderColor = 'oklch(62% 0.18 30)'}
            onBlur={e => e.target.style.borderColor = 'oklch(88% 0.05 30)'}
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
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 12, color: 'oklch(48% 0.01 260)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
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
        viewCount={c.viewCount}
        onReact={onReact}
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
    </div>
  );
}
