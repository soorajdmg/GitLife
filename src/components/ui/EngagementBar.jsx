import { useState, useRef, useEffect } from 'react';
import { fmt } from '../../data/gitlife';

const rxStyle = (type, active) => {
  const m = {
    fork:    { b: 'oklch(60% 0.19 55)',  f: 'oklch(45% 0.19 55)',  bg: 'oklch(96% 0.015 60)'  },
    merge:   { b: 'oklch(52% 0.2 260)',  f: 'oklch(42% 0.2 260)',  bg: 'oklch(95% 0.015 260)' },
    support: { b: 'oklch(50% 0.18 155)', f: 'oklch(40% 0.18 155)', bg: 'oklch(95% 0.015 155)' },
  }[type];
  return active
    ? { border: `1px solid ${m.b}`, color: m.f, background: m.bg }
    : { border: '1px solid oklch(90% 0.006 260)', color: 'oklch(50% 0.01 260)', background: 'white' };
};

const btnBase = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '5px 9px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  transition: 'all 0.12s', cursor: 'pointer',
};

export default function EngagementBar({
  commitId,
  reactions = { fork: 0, merge: 0, support: 0 },
  userReactions = {},
  commentCount = 0,
  isStashed = false,
  isAuthor = false,
  isFork = false,
  viewCount = 0,
  onReact,
  onFork,
  onMerge,
  onReplyClick,
  onStash,
  onShare,
  compact = false,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef();

  useEffect(() => {
    if (!shareOpen) return;
    const handler = e => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  const copyLink = () => {
    const url = `${window.location.origin}/?commit=${commitId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setShareOpen(false); }, 1500);
    });
  };

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid oklch(95% 0.004 80)', gap: 4 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Left: reactions + reply */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { type: 'fork',    label: 'Fork',  icon: null },
          { type: 'merge',   label: 'Merge', icon: null },
          { type: 'support', label: null,    icon: (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11.5 C7 11.5 1.5 8 1.5 4.5a2.8 2.8 0 0 1 5.5-0.8 2.8 2.8 0 0 1 5.5 0.8C12.5 8 7 11.5 7 11.5z" />
            </svg>
          )},
        ].map(({ type, label, icon }) => {
          const active = userReactions[type];
          const count = reactions[type] ?? 0;
          // Fork hidden for authors and for forked commits (can't fork a fork)
          if (type === 'fork' && (isAuthor || isFork)) return null;
          // Merge hidden for authors
          if (type === 'merge' && isAuthor) return null;
          const handleClick = () => {
            if (type === 'fork') onFork?.(commitId);
            else if (type === 'merge') onMerge?.(commitId);
            else onReact?.(commitId, type);
          };
          return (
            <button
              key={type}
              onClick={handleClick}
              style={{ ...btnBase, ...rxStyle(type, active) }}
              title={type === 'fork' ? 'Explore this path on your profile' : type === 'merge' ? 'Link to one of your own decisions' : 'I support this'}
            >
              {icon ?? <span style={{ fontWeight: 600 }}>{label}</span>} {fmt(count)}
            </button>
          );
        })}

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: 'oklch(90% 0.006 260)', margin: '0 2px', flexShrink: 0 }} />

        {/* Reply */}
        <button
          onClick={() => onReplyClick?.(commitId)}
          style={{ ...btnBase, border: '1px solid oklch(90% 0.006 260)', color: 'oklch(50% 0.01 260)', background: 'white' }}
          title="Replies"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3.5C2 2.7 2.7 2 3.5 2h9C13.3 2 14 2.7 14 3.5v6c0 .8-.7 1.5-1.5 1.5H9l-3 2.5V11H3.5C2.7 11 2 10.3 2 9.5v-6z" />
            <line x1="5" y1="5.5" x2="11" y2="5.5" /><line x1="5" y1="8" x2="8.5" y2="8" />
          </svg>
          {commentCount > 0 ? `${fmt(commentCount)} ${commentCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
        </button>
      </div>

      {/* Right: views (author-only), stash, share */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isAuthor && (
          <span style={{ fontSize: 11, color: 'oklch(62% 0.008 260)', display: 'flex', alignItems: 'center', gap: 3, marginRight: 4 }} title="Views (only you can see this)">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 7C1.5 7 3.5 3 7 3s5.5 4 5.5 4-2 4-5.5 4S1.5 7 1.5 7z" /><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            {fmt(viewCount)}
          </span>
        )}

        {/* Stash */}
        <button
          onClick={() => onStash?.(commitId)}
          title={isStashed ? 'Unstash' : 'Stash this commit'}
          style={{ ...btnBase, border: '1px solid oklch(90% 0.006 260)', background: isStashed ? 'oklch(95% 0.015 260)' : 'white', color: isStashed ? 'oklch(42% 0.2 260)' : 'oklch(58% 0.01 260)', padding: '5px 8px' }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill={isStashed ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2h8a1 1 0 0 1 1 1v9l-5-2.5L2 12V3a1 1 0 0 1 1-1z" />
          </svg>
        </button>

        {/* Share */}
        <div style={{ position: 'relative' }} ref={shareRef}>
          <button
            onClick={() => setShareOpen(p => !p)}
            title="Share"
            style={{ ...btnBase, border: '1px solid oklch(90% 0.006 260)', color: 'oklch(50% 0.01 260)', background: shareOpen ? 'oklch(95% 0.015 260)' : 'white', padding: '5px 8px' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2l3 3-3 3" /><path d="M12 5H6a3 3 0 0 0-3 3v2" />
            </svg>
          </button>
          {shareOpen && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: 'white', border: '1px solid oklch(91% 0.006 80)', borderRadius: 10, boxShadow: '0 4px 20px oklch(25% 0.05 260 / 0.12)', zIndex: 100, overflow: 'hidden', minWidth: 160 }}>
              <button
                onClick={copyLink}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(25% 0.015 260)', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.006 80)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {copied ? '✓ Copied!' : 'Copy link'}
              </button>
              {onShare && (
                <button
                  onClick={() => { onShare(commitId); setShareOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', borderTop: '1px solid oklch(94% 0.004 80)', fontSize: 12.5, fontWeight: 500, color: 'oklch(25% 0.015 260)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.006 80)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Send in DM
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
