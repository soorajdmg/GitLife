import { useState, useRef, useEffect } from 'react';
import { CATEGORIES } from '../data/gitlife';
import CommitCard from '../components/ui/CommitCard';

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'just now';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapToCard(d) {
  return {
    id: d.id,
    userId: d.userId,
    userInfo: d.userInfo || null,
    username: d.userInfo?.username || d.username,
    fullName: d.userInfo?.fullName || d.fullName,
    avatarUrl: d.userInfo?.avatarUrl || d.avatarUrl,
    branch: d.branch_name || d.branch,
    message: d.decision || d.message,
    body: d.body || null,
    image: d.image || d.img || null,
    category: d.type || d.category || 'Career',
    ts: d.ts || formatRelativeTime(d.createdAt || d.timestamp),
    impact: d.impact ?? null,
    viewCount: d.viewCount ?? 0,
    commentCount: d.commentCount ?? 0,
    rx: d.rx || { fork: d.reactions?.fork?.count ?? 0, merge: d.reactions?.merge?.count ?? 0, support: d.reactions?.support?.count ?? 0 },
    ur: d.ur || { fork: d.userReactions?.fork ?? false, merge: d.userReactions?.merge ?? false, support: d.userReactions?.support ?? false },
    stashed: d.stashed ?? false,
    wi: (d.branch_name || d.branch) !== 'main',
  };
}

export default function FeedView({ feedData = { following: [], trending: [], hasFollowing: false }, onReact, onStash, onDelete, onNew, compact, loading, currentUser, openMessage, onProfile, hideFab }) {
  const [filter, setFilter] = useState('All');
  const seenRef = useRef(new Set());

  const following = (feedData.following || []).map(mapToCard);
  const trending = (feedData.trending || []).map(mapToCard);

  // Track seen IDs as posts are rendered
  useEffect(() => {
    following.forEach(c => seenRef.current.add(c.id));
    trending.forEach(c => seenRef.current.add(c.id));
  }, [following.length, trending.length]);

  const applyFilter = list => filter === 'All' ? list : list.filter(c => c.category === filter);
  const shownFollowing = applyFilter(following);
  const shownTrending = applyFilter(trending);

  const allEmpty = shownFollowing.length === 0 && shownTrending.length === 0;
  const followingEmpty = shownFollowing.length === 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Filter bar — sticky on desktop, scrolls with content on mobile */}
        <div className="feed-filter-bar" style={{ background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', padding: '12px clamp(16px, 2.5vw, 40px)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...CATEGORIES].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, border: `1px solid ${filter === f ? 'oklch(52% 0.2 260)' : 'oklch(88% 0.008 260)'}`, background: filter === f ? 'oklch(52% 0.2 260)' : 'white', color: filter === f ? 'white' : 'oklch(48% 0.01 260)', transition: 'all 0.12s', cursor: 'pointer' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 'var(--feed-max-width, 680px)', margin: '0 auto', padding: '20px 16px 80px' }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)', padding: '18px 20px', marginBottom: 12 }}>
                <div style={{ height: 14, width: '60%', background: 'oklch(93% 0.006 80)', borderRadius: 6, marginBottom: 10 }} />
                <div style={{ height: 11, width: '40%', background: 'oklch(95% 0.004 80)', borderRadius: 5 }} />
              </div>
            ))
          ) : allEmpty ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(58% 0.01 260)', fontSize: 14 }}>
              {feedData.hasFollowing
                ? 'All caught up! No posts match this filter.'
                : 'Follow people to see their commits here.'}
            </div>
          ) : (
            <>
              {/* Following posts */}
              {shownFollowing.map(c => (
                <CommitCard key={c.id} c={c} onReact={onReact} onStash={onStash} onDelete={onDelete} compact={compact} currentUser={currentUser} openMessage={openMessage} onProfile={onProfile} />
              ))}

              {/* Divider: All caught up / Trending */}
              {followingEmpty && feedData.hasFollowing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 20px', padding: '0 4px' }}>
                  <div style={{ flex: 1, height: 1, background: 'oklch(91% 0.006 80)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'oklch(58% 0.01 260)', whiteSpace: 'nowrap' }}>All caught up</span>
                  <div style={{ flex: 1, height: 1, background: 'oklch(91% 0.006 80)' }} />
                </div>
              ) : shownFollowing.length > 0 && shownTrending.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 20px', padding: '0 4px' }}>
                  <div style={{ flex: 1, height: 1, background: 'oklch(91% 0.006 80)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'oklch(58% 0.01 260)', whiteSpace: 'nowrap' }}>Trending</span>
                  <div style={{ flex: 1, height: 1, background: 'oklch(91% 0.006 80)' }} />
                </div>
              ) : null}

              {/* Trending posts */}
              {shownTrending.map(c => (
                <CommitCard key={c.id} c={c} onReact={onReact} onStash={onStash} onDelete={onDelete} compact={compact} currentUser={currentUser} openMessage={openMessage} onProfile={onProfile} />
              ))}

              {/* No following + trending exists: label it */}
              {!feedData.hasFollowing && shownTrending.length > 0 && (
                <div style={{ textAlign: 'center', fontSize: 11.5, color: 'oklch(62% 0.01 260)', marginTop: 8, paddingBottom: 4 }}>
                  Follow people to see their commits here
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!hideFab && (
        <button onClick={onNew}
          style={{ position: 'fixed', bottom: 28, right: 'clamp(28px, 3vw, 48px)', background: 'oklch(52% 0.2 260)', color: 'white', border: 'none', borderRadius: 13, padding: '11px 20px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, boxShadow: '0 4px 20px oklch(52% 0.2 260 / 0.35)', transition: 'all 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 26px oklch(52% 0.2 260 / 0.42)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px oklch(52% 0.2 260 / 0.35)'; }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New commit
        </button>
      )}
    </div>
  );
}
