import { useState, useEffect, useCallback } from 'react';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import BranchPill from '../components/ui/BranchPill';
import Tag from '../components/ui/Tag';
import EngagementBar from '../components/ui/EngagementBar';
import CommentThread from '../components/ui/CommentThread';
import { catColor, fmt } from '../data/gitlife';

const CATEGORIES = ['Career', 'Health', 'Relationships', 'Finance', 'Education', 'Travel', 'Housing'];

function userInitials(user) {
  if (!user) return '?';
  const name = user.fullName || user.username || '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function userColor(userId) {
  const colors = [
    'oklch(52% 0.2 260)', 'oklch(56% 0.2 330)', 'oklch(50% 0.18 155)',
    'oklch(60% 0.19 55)', 'oklch(52% 0.18 200)', 'oklch(58% 0.2 40)',
    'oklch(50% 0.18 230)', 'oklch(52% 0.18 160)'
  ];
  if (!userId) return colors[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function isWhatIf(branch) {
  return /^what-if\//i.test(branch || '');
}

function inferCategory(decision) {
  const text = (decision || '').toLowerCase();
  if (/job|career|work|freelan|startup|compan|promot|resign|quit|hire/.test(text)) return 'Career';
  if (/health|gym|workout|run|marathon|therapy|meditat|sleep|diet|fitness/.test(text)) return 'Health';
  if (/relationship|partner|dating|married|divorce|friend|family/.test(text)) return 'Relationships';
  if (/money|finance|invest|loan|debt|salary|budget|crypto|stock/.test(text)) return 'Finance';
  if (/school|degree|course|learn|study|phd|university|college|education/.test(text)) return 'Education';
  if (/travel|trip|abroad|move|relocat|city|country/.test(text)) return 'Travel';
  if (/house|home|rent|buy|apartment|move|neighbor/.test(text)) return 'Housing';
  return null;
}

function ExploreCard({ item, rank, onProfile, currentUserId, isStashed, onReact, onStash, onMessage }) {
  const user = item.userInfo;
  const ini = userInitials(user);
  const color = userColor(item.userId);
  const wi = isWhatIf(item.branch_name);
  const category = item.type || inferCategory(item.decision);
  const rankBg = ['oklch(72% 0.18 60)', 'oklch(78% 0.06 260)', 'oklch(68% 0.12 30)'][rank - 1];
  const userId = item.userInfo?._id ? item.userInfo._id.toString() : item.userId;
  const isOwnPost = currentUserId && currentUserId === item.userId;

  const [replyOpen, setReplyOpen] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(item.commentCount ?? 0);

  return (
    <div style={{
      background: wi ? 'oklch(99.5% 0.012 65)' : 'white',
      border: `1px solid ${wi ? 'oklch(88% 0.1 60)' : 'oklch(91% 0.006 80)'}`,
      borderRadius: 14, padding: '16px 18px', marginBottom: 10, position: 'relative', overflow: 'hidden'
    }}>
      {rank && rank <= 3 && (
        <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 6, background: rankBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: 'white' }}>
          #{rank}
        </div>
      )}
      {wi && <div style={{ fontSize: 11.5, color: 'oklch(48% 0.19 55)', fontWeight: 500, marginBottom: 7 }}>⎇ what-if</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <div onClick={() => onProfile && userId && onProfile(userId)}
          style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: 'white', flexShrink: 0, cursor: onProfile && userId ? 'pointer' : 'default' }}>
          {ini}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span onClick={() => onProfile && userId && onProfile(userId)}
            style={{ fontSize: 13, fontWeight: 600, cursor: onProfile && userId ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (onProfile && userId) e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
            {user?.fullName || user?.username || 'Unknown'}
          </span>
          {user?.username && (
            <span style={{ fontSize: 11.5, color: 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", marginLeft: 6 }}>
              @{user.username}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'oklch(58% 0.01 260)', marginLeft: 6 }}>{timeAgo(item.createdAt || item.timestamp)}</span>
        </div>
        <BranchPill name={item.branch_name || 'main'} wi={wi} merged={false} />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, marginBottom: 10, color: wi ? 'oklch(42% 0.18 55)' : 'oklch(15% 0.015 260)' }}>
        {item.decision}
      </div>
      {item.body && (
        <div style={{ fontSize: 13, color: 'oklch(44% 0.01 260)', lineHeight: 1.6, marginBottom: 10 }}>{item.body}</div>
      )}
      {category && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Tag cat={category} />
          {item.impact != null && (
            <span style={{ fontSize: 11, color: 'oklch(52% 0.01 260)', background: 'oklch(95% 0.006 80)', border: '1px solid oklch(90% 0.006 80)', borderRadius: 6, padding: '2px 7px', fontWeight: 500 }}>
              impact {item.impact}
            </span>
          )}
        </div>
      )}
      <EngagementBar
        commitId={item.id}
        reactions={{ fork: item.reactions?.fork?.count ?? 0, merge: item.reactions?.merge?.count ?? 0, support: item.reactions?.support?.count ?? 0 }}
        userReactions={item.userReactions || {}}
        commentCount={localCommentCount}
        isStashed={isStashed}
        isAuthor={isOwnPost}
        viewCount={item.viewCount ?? 0}
        onReact={onReact}
        onReplyClick={() => setReplyOpen(p => !p)}
        onStash={onStash}
        onShare={!isOwnPost && onMessage && userId ? () => onMessage(userId) : null}
        compact
      />
      {replyOpen && (
        <CommentThread
          decisionId={item.id}
          currentUserId={currentUserId}
          initialCount={localCommentCount}
          onCountChange={delta => setLocalCommentCount(p => Math.max(0, p + delta))}
        />
      )}
    </div>
  );
}

function UserCard({ user, onMessage, onProfile }) {
  const ini = userInitials(user);
  const color = userColor(user.id);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 12, border: '1px solid oklch(91% 0.006 80)', marginBottom: 8 }}>
      <div onClick={() => onProfile && onProfile(user.id)}
        style={{ width: 44, height: 44, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0, cursor: onProfile ? 'pointer' : 'default' }}>
        {ini}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div onClick={() => onProfile && onProfile(user.id)}
          style={{ fontSize: 14, fontWeight: 600, cursor: onProfile ? 'pointer' : 'default', display: 'inline-block' }}
          onMouseEnter={e => { if (onProfile) e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
          {user.fullName || user.username}
        </div>
        <div style={{ fontSize: 11.5, color: 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace" }}>@{user.username}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{user.commitCount}</div>
          <div style={{ fontSize: 11, color: 'oklch(58% 0.01 260)' }}>commits</div>
        </div>
        {onMessage && (
          <button onClick={() => onMessage(user.id)}
            title="Send message"
            style={{ border: '1px solid oklch(88% 0.008 260)', background: 'white', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: 'oklch(42% 0.2 260)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'oklch(52% 0.2 260)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = '1px solid oklch(52% 0.2 260)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'oklch(42% 0.2 260)'; e.currentTarget.style.border = '1px solid oklch(88% 0.008 260)'; }}>
            Message
          </button>
        )}
      </div>
    </div>
  );
}

export default function ExploreView({ onMessage, onProfile, currentUser, stashedIds = [], onStashChange }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('recent');
  const [catFilter, setCatFilter] = useState('All');
  const [feed, setFeed] = useState([]);
  const [users, setUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followed, setFollowed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Local reaction overrides: { [commitId]: { reactions, userReactions } }
  const [reactionState, setReactionState] = useState({});
  const [localStashed, setLocalStashed] = useState(new Set(stashedIds));

  // Keep localStashed in sync if parent stashedIds changes
  useEffect(() => { setLocalStashed(new Set(stashedIds)); }, [stashedIds]);

  const handleReact = (id, type) => {
    setReactionState(prev => {
      const item = feed.find(f => f.id === id);
      const cur = prev[id] || {
        reactions: { fork: item?.reactions?.fork?.count ?? 0, merge: item?.reactions?.merge?.count ?? 0, support: item?.reactions?.support?.count ?? 0 },
        userReactions: item?.userReactions || {},
      };
      const wasActive = cur.userReactions[type];
      return {
        ...prev,
        [id]: {
          reactions: { ...cur.reactions, [type]: cur.reactions[type] + (wasActive ? -1 : 1) },
          userReactions: { ...cur.userReactions, [type]: !wasActive },
        },
      };
    });
    api.reactToDecision(id, type).catch(() => {
      // Revert: reload the item from feed original
      setReactionState(prev => { const n = { ...prev }; delete n[id]; return n; });
    });
  };

  const handleStash = (id) => {
    const wasStashed = localStashed.has(id);
    setLocalStashed(prev => { const n = new Set(prev); wasStashed ? n.delete(id) : n.add(id); return n; });
    onStashChange?.(id, !wasStashed);
    api.toggleStash(id).catch(() => {
      setLocalStashed(prev => { const n = new Set(prev); wasStashed ? n.add(id) : n.delete(id); return n; });
      onStashChange?.(id, wasStashed);
    });
  };

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const type = tab === 'whatifs' ? 'whatifs' : undefined;
      const data = await api.getExploreFeed({ limit: 60, type });
      setFeed(data);
    } catch (err) {
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    api.getSuggestedUsers(12).then(data => {
      setSuggestedUsers(data);
      // Seed followed set from server state
      setFollowed(new Set(data.filter(u => u.isFollowing).map(u => u.id)));
    }).catch(() => setSuggestedUsers([]));
  }, []);

  // Search users when search query changes
  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.searchUsers(search.trim());
        // Exclude self
        setUsers(data.filter(u => u.id !== user?.id));
      } catch {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, user?.id]);

  // Filter feed client-side by category and search
  const shownItems = feed.filter(item => {
    const category = inferCategory(item.decision);
    const matchesCat = catFilter === 'All' || category === catFilter;
    const matchesSearch = !search.trim() ||
      item.decision?.toLowerCase().includes(search.toLowerCase()) ||
      item.userInfo?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.userInfo?.username?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Sort for trending tab: by most recent
  const sortedItems = tab === 'trending'
    ? [...shownItems].sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
    : shownItems;

  const toggleFollow = async (id) => {
    const wasFollowing = followed.has(id);
    // Optimistic update
    setFollowed(prev => {
      const next = new Set(prev);
      wasFollowing ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (wasFollowing) {
        await api.unfollowUser(id);
      } else {
        await api.followUser(id);
      }
    } catch {
      // Revert on error
      setFollowed(prev => {
        const next = new Set(prev);
        wasFollowing ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', padding: '12px 22px', flexShrink: 0 }}>
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'oklch(62% 0.01 260)', pointerEvents: 'none' }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search decisions, people, branches..."
            style={{ width: '100%', padding: '9px 36px 9px 36px', borderRadius: 10, border: '1px solid oklch(88% 0.008 260)', fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', background: 'oklch(98.5% 0.005 80)', color: 'oklch(18% 0.015 260)', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'}
            onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 17, color: 'oklch(60% 0.01 260)', lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* Suggested people — full-width strip above the constrained content */}
      {!search && suggestedUsers.length > 0 && (
        <div style={{ flexShrink: 0, borderBottom: '1px solid oklch(91% 0.006 80)', padding: '16px 22px 18px', background: 'white' }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 12 }}>Suggested people</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {suggestedUsers.map(u => {
              const ini = userInitials(u);
              const color = userColor(u.id);
              const isFollowed = followed.has(u.id);
              return (
                <div key={u.id} style={{ flexShrink: 0, width: 130, background: 'oklch(98.5% 0.005 80)', border: '1px solid oklch(91% 0.006 80)', borderRadius: 14, padding: '18px 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 4px oklch(70% 0.01 260 / 0.06)', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 14px oklch(70% 0.01 260 / 0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px oklch(70% 0.01 260 / 0.06)'}>
                  <div onClick={() => onProfile && onProfile(u.id)}
                    style={{ width: 54, height: 54, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 10, position: 'relative', cursor: onProfile ? 'pointer' : 'default' }}>
                    {ini}
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: 'oklch(58% 0.18 155)', border: '2px solid white' }} />
                  </div>
                  <div onClick={() => onProfile && onProfile(u.id)}
                    style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 2, lineHeight: 1.2, cursor: onProfile ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (onProfile) e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
                    {(() => { const parts = (u.fullName || u.username || '').split(' '); return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : parts[0]; })()}
                  </div>
                  <div style={{ fontSize: 11, color: 'oklch(58% 0.01 260)', textAlign: 'center', marginBottom: u.mutualCount > 0 ? 4 : 12 }}>{u.commitCount} commits</div>
                  {u.mutualCount > 0 && (
                    <div style={{ fontSize: 10.5, color: 'oklch(45% 0.18 155)', textAlign: 'center', marginBottom: 12, fontWeight: 500 }}>
                      {u.mutualCount} mutual
                    </div>
                  )}
                  <button onClick={() => toggleFollow(u.id)}
                    style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: `1px solid ${isFollowed ? 'oklch(88% 0.008 260)' : 'oklch(52% 0.2 260)'}`, background: isFollowed ? 'white' : 'oklch(52% 0.2 260)', color: isFollowed ? 'oklch(44% 0.01 260)' : 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.14s', marginBottom: 6 }}>
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                  {onMessage && (
                    <button onClick={() => onMessage(u.id)}
                      style={{ width: '100%', padding: '5px 0', borderRadius: 8, border: '1px solid oklch(88% 0.008 260)', background: 'white', color: 'oklch(42% 0.2 260)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer' }}>
                      Message
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '18px 22px 60px' }}>

          {/* Tabs + category filters (only when not searching) */}
          {!search && (
            <>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
                {['All', ...CATEGORIES].map(cat => {
                  const active = catFilter === cat;
                  const c = cat !== 'All' ? catColor(cat) : null;
                  return (
                    <button key={cat} onClick={() => setCatFilter(cat)}
                      style={{ flexShrink: 0, padding: '5px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'all 0.13s', border: `1px solid ${active ? (c ? c.fg : 'oklch(52% 0.2 260)') : 'oklch(88% 0.008 260)'}`, background: active ? (c ? c.bg : 'oklch(93% 0.05 260)') : 'white', color: active ? (c ? c.fg : 'oklch(42% 0.2 260)') : 'oklch(48% 0.01 260)' }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: 'white', borderRadius: 10, border: '1px solid oklch(91% 0.006 80)', padding: 4 }}>
                {[['recent', '🕐  Recent'], ['trending', '🔥  Trending'], ['whatifs', '⎇  What-ifs']].map(([id, lbl]) => (
                  <button key={id} onClick={() => setTab(id)}
                    style={{ flex: 1, padding: 7, borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, background: tab === id ? 'oklch(52% 0.2 260)' : 'transparent', color: tab === id ? 'white' : 'oklch(50% 0.01 260)', cursor: 'pointer', transition: 'all 0.14s' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* People results when searching */}
          {search && users.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 11, padding: '0 2px' }}>People</div>
              {users.map(u => <UserCard key={u.id} user={u} onMessage={u.id !== user?.id ? onMessage : null} onProfile={u.id !== user?.id ? onProfile : null} />)}
              {sortedItems.length > 0 && (
                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 11, marginTop: 22, padding: '0 2px' }}>Decisions</div>
              )}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(58% 0.01 260)' }}>
              <div style={{ fontSize: 14 }}>Loading...</div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(55% 0.18 20)' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{error}</div>
              <button onClick={loadFeed} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 8, border: '1px solid oklch(88% 0.008 260)', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                Retry
              </button>
            </div>
          )}

          {/* Feed cards */}
          {!loading && !error && sortedItems.map((item, i) => (
            <ExploreCard
                    key={item.id}
                    item={{ ...item, ...(reactionState[item.id] ? { reactions: { fork: { count: reactionState[item.id].reactions.fork }, merge: { count: reactionState[item.id].reactions.merge }, support: { count: reactionState[item.id].reactions.support } }, userReactions: reactionState[item.id].userReactions } : {}) }}
                    rank={tab === 'trending' && !search ? i + 1 : null}
                    onProfile={onProfile}
                    currentUserId={currentUser?.id || currentUser?._id}
                    isStashed={localStashed.has(item.id)}
                    onReact={handleReact}
                    onStash={handleStash}
                    onMessage={onMessage}
                  />
          ))}

          {/* Empty state */}
          {!loading && !error && sortedItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(58% 0.01 260)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⌕</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {feed.length === 0 ? 'No decisions shared yet. Be the first!' : 'No results found'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
