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
  viewCount = 0,
  onReact,
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
        {[['⎇', 'fork'], ['↩', 'merge'], ['♡', 'support']].map(([icon, type]) => {
          const active = userReactions[type];
          const count = reactions[type] ?? 0;
          return (
            <button
              key={type}
              onClick={() => onReact?.(commitId, type)}
              style={{ ...btnBase, ...rxStyle(type, active) }}
              title={type === 'fork' ? "I'd explore this" : type === 'merge' ? "I've done this" : 'I support this'}
            >
              {icon} {compact && count === 0 ? '' : fmt(count)}
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
          ↲ {commentCount > 0 ? (compact ? fmt(commentCount) : `${fmt(commentCount)} ${commentCount === 1 ? 'reply' : 'replies'}`) : (compact ? '0' : 'Reply')}
        </button>
      </div>

      {/* Right: views (author-only), stash, share */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isAuthor && (
          <span style={{ fontSize: 11, color: 'oklch(62% 0.008 260)', display: 'flex', alignItems: 'center', gap: 3, marginRight: 4 }} title="Views (only you can see this)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <ellipse cx="6" cy="6" rx="5" ry="3.2" /><circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
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
          {isStashed ? '⊠' : '⊞'}
        </button>

        {/* Share */}
        <div style={{ position: 'relative' }} ref={shareRef}>
          <button
            onClick={() => setShareOpen(p => !p)}
            title="Share"
            style={{ ...btnBase, border: '1px solid oklch(90% 0.006 260)', color: 'oklch(50% 0.01 260)', background: shareOpen ? 'oklch(95% 0.015 260)' : 'white', padding: '5px 8px' }}
          >
            ↗
          </button>
          {shareOpen && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: 'white', border: '1px solid oklch(91% 0.006 80)', borderRadius: 10, boxShadow: '0 4px 20px oklch(25% 0.05 260 / 0.12)', zIndex: 100, overflow: 'hidden', minWidth: 160 }}>
              <button
                onClick={copyLink}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(25% 0.015 260)', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.006 80)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {copied ? '✓ Copied!' : '⎘ Copy link'}
              </button>
              {onShare && (
                <button
                  onClick={() => { onShare(commitId); setShareOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', borderTop: '1px solid oklch(94% 0.004 80)', fontSize: 12.5, fontWeight: 500, color: 'oklch(25% 0.015 260)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.006 80)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  ↗ Send in DM
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
