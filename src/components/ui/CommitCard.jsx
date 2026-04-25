import { useState } from 'react';
import Avatar from './Avatar';
import BranchPill from './BranchPill';
import Tag from './Tag';
import EngagementBar from './EngagementBar';
import CommentThread from './CommentThread';

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

export default function CommitCard({ c, onReact, onStash, compact, currentUser, openMessage }) {
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

  const handleCountChange = (delta) => setLocalCommentCount(p => Math.max(0, p + delta));

  const handleShare = () => {
    if (!isOwnPost && openMessage && c.userId) openMessage(c.userId);
  };

  return (
    <div
      style={{
        background: c.wi ? 'oklch(99.5% 0.012 65)' : 'white',
        border: `1px solid ${c.wi ? 'oklch(88% 0.1 60)' : 'oklch(91% 0.006 80)'}`,
        borderRadius: 14, padding: compact ? '14px 16px' : '18px 20px',
        marginBottom: 10, transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 16px oklch(70% 0.01 260 / 0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {c.wi && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'oklch(48% 0.19 55)', fontWeight: 500, marginBottom: 8 }}>⎇ what-if branch</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar u={user} size={compact ? 32 : 36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: 'oklch(58% 0.01 260)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{user.handle}</span><span>·</span><span>{c.ts}</span>
          </div>
        </div>
        <BranchPill name={c.branch} wi={c.wi} merged={false} />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Tag cat={c.category} />
        {c.impact != null && (
          <span style={{ fontSize: 11, color: 'oklch(52% 0.01 260)', background: 'oklch(95% 0.006 80)', border: '1px solid oklch(90% 0.006 80)', borderRadius: 6, padding: '2px 7px', fontWeight: 500 }}>
            impact {c.impact}
          </span>
        )}
      </div>

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
        />
      )}
    </div>
  );
}
