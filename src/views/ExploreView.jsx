import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../config/api';
import { QUERY_KEYS } from '../config/queryClient';
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

function tileBg(category, wi) {
  if (wi) return { bg: 'linear-gradient(135deg, oklch(30% 0.14 55) 0%, oklch(22% 0.1 55) 100%)', text: 'oklch(88% 0.08 60)' };
  const map = {
    Career:        { bg: 'linear-gradient(135deg, oklch(28% 0.15 260) 0%, oklch(20% 0.1 260) 100%)',  text: 'oklch(88% 0.08 260)' },
    Health:        { bg: 'linear-gradient(135deg, oklch(28% 0.14 155) 0%, oklch(20% 0.1 155) 100%)',  text: 'oklch(88% 0.08 155)' },
    Relationships: { bg: 'linear-gradient(135deg, oklch(28% 0.14 330) 0%, oklch(20% 0.1 330) 100%)',  text: 'oklch(88% 0.08 330)' },
    Finance:       { bg: 'linear-gradient(135deg, oklch(28% 0.14 60) 0%, oklch(20% 0.1 60) 100%)',    text: 'oklch(88% 0.08 60)' },
    Education:     { bg: 'linear-gradient(135deg, oklch(28% 0.14 200) 0%, oklch(20% 0.1 200) 100%)',  text: 'oklch(88% 0.08 200)' },
    Travel:        { bg: 'linear-gradient(135deg, oklch(28% 0.14 25) 0%, oklch(20% 0.1 25) 100%)',    text: 'oklch(88% 0.08 25)' },
    Housing:       { bg: 'linear-gradient(135deg, oklch(28% 0.14 80) 0%, oklch(20% 0.1 80) 100%)',    text: 'oklch(88% 0.08 80)' },
  };
  return map[category] || { bg: 'linear-gradient(135deg, oklch(22% 0.03 260) 0%, oklch(15% 0.02 260) 100%)', text: 'oklch(82% 0.04 260)' };
}

// ─── Grid Tile ────────────────────────────────────────────────────────────────
function GridTile({ item, onClick }) {
  const [hovered, setHovered] = useState(false);
  const wi = isWhatIf(item.branch_name);
  const category = item.type || inferCategory(item.decision);
  const hasImage = !!(item.image || item.img);
  const { bg, text } = tileBg(category, wi);

  const totalReactions = (item.reactions?.fork?.count ?? 0) +
    (item.reactions?.merge?.count ?? 0) +
    (item.reactions?.support?.count ?? 0);

  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '100%',
        cursor: 'pointer',
        borderRadius: 4,
        overflow: 'hidden',
        background: hasImage ? '#000' : bg,
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {hasImage ? (
          <img
            src={item.image || item.img}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => e.target.style.display = 'none'}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px',
            boxSizing: 'border-box',
          }}>
            {category && (
              <div style={{
                position: 'absolute', top: 8, left: 8,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: text, opacity: 0.7,
              }}>
                {category}
              </div>
            )}
            {wi && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                fontSize: 9, fontWeight: 700, color: 'oklch(80% 0.1 60)',
                background: 'oklch(25% 0.1 55 / 0.6)', borderRadius: 4, padding: '2px 5px',
              }}>
                ⎇ what-if
              </div>
            )}
            <p style={{
              color: 'white',
              fontSize: 'clamp(11px, 2.5vw, 15px)',
              fontWeight: 700,
              lineHeight: 1.35,
              textAlign: 'center',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {item.decision}
            </p>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'oklch(10% 0.02 260 / 0.55)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.18s',
      }}>
        {item.userInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {item.userInfo.avatarUrl
              ? <img src={item.userInfo.avatarUrl} alt="" referrerPolicy="no-referrer"
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid white' }} />
              : <div style={{ width: 22, height: 22, borderRadius: '50%', background: userColor(item.userId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white', border: '1.5px solid white' }}>
                  {userInitials(item.userInfo)}
                </div>
            }
            <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>
              {item.userInfo.fullName || item.userInfo.username}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M7 11.5 C7 11.5 1.5 8 1.5 4.5a2.8 2.8 0 0 1 5.5-0.8 2.8 2.8 0 0 1 5.5 0.8C12.5 8 7 11.5 7 11.5z" /></svg>
            {fmt(totalReactions)}
          </span>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3.5C2 2.7 2.7 2 3.5 2h7C11.3 2 12 2.7 12 3.5v5c0 .8-.7 1.5-1.5 1.5H8L5 11V10H3.5C2.7 10 2 9.3 2 8.5v-5z" />
            </svg>
            {fmt(item.commentCount ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Single Post Card (used in feed view) ────────────────────────────────────
function PostCard({ item, currentUserId, isStashed, onReact, onStash, onMessage, onProfile, reactionOverride }) {
  const user = item.userInfo;
  const ini = userInitials(user);
  const color = userColor(item.userId);
  const wi = isWhatIf(item.branch_name);
  const category = item.type || inferCategory(item.decision);
  const userId = user?._id ? user._id.toString() : item.userId;
  const isOwnPost = currentUserId && currentUserId === item.userId;
  const [localCommentCount, setLocalCommentCount] = useState(item.commentCount ?? 0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);

  const reactions = reactionOverride?.reactions || {
    fork: item.reactions?.fork?.count ?? 0,
    merge: item.reactions?.merge?.count ?? 0,
    support: item.reactions?.support?.count ?? 0,
  };
  const userReactions = reactionOverride?.userReactions || item.userReactions || {};

  return (
    <div
      style={{
        background: wi ? 'oklch(99.5% 0.012 65)' : 'white',
        border: `1px solid ${wi ? 'oklch(88% 0.1 60)' : 'oklch(91% 0.006 80)'}`,
        borderRadius: 14,
        marginBottom: 12,
        padding: '14px 16px',
        transition: 'box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 16px oklch(70% 0.01 260 / 0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* what-if label */}
      {wi && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'oklch(48% 0.19 55)', fontWeight: 500, marginBottom: 8 }}>
          ⎇ what-if branch
        </div>
      )}

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt={ini} onClick={() => onProfile?.(user?.username || userId)}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
              referrerPolicy="no-referrer" />
          : <div onClick={() => onProfile?.(user?.username || userId)}
              style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, cursor: 'pointer' }}>
              {ini}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            onClick={() => onProfile?.(user?.username || userId)}
            style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-block' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {user?.fullName || user?.username || 'Unknown'}
          </div>
          <div style={{ fontSize: 12, color: 'oklch(58% 0.01 260)', display: 'flex', gap: 6, alignItems: 'center' }}>
            {user?.username && <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>@{user.username}</span>}
            <span>·</span>
            <span>{timeAgo(item.createdAt || item.timestamp)}</span>
          </div>
        </div>
        <BranchPill name={item.branch_name || 'main'} wi={wi} merged={false} />
      </div>

      {/* Decision title */}
      <div
        style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: item.body ? 6 : 10, color: wi ? 'oklch(42% 0.18 55)' : 'oklch(15% 0.015 260)', cursor: item.body ? 'pointer' : 'default' }}
        onClick={() => item.body && setBodyOpen(p => !p)}
      >
        {item.decision}
      </div>

      {/* Body with read more */}
      {item.body && (bodyOpen || item.body.length < 90) && (
        <div style={{ fontSize: 13.5, color: 'oklch(44% 0.01 260)', lineHeight: 1.65, marginBottom: 10 }}>{item.body}</div>
      )}
      {item.body && item.body.length >= 90 && !bodyOpen && (
        <div style={{ fontSize: 12, color: 'oklch(52% 0.2 260)', marginBottom: 8, marginTop: -2, cursor: 'pointer' }} onClick={() => setBodyOpen(true)}>Read more</div>
      )}

      {/* Image */}
      {(item.image || item.img) && (
        <div style={{ margin: '10px 0', borderRadius: 10, overflow: 'hidden', maxHeight: 220 }}>
          <img
            src={item.image || item.img}
            alt=""
            style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 }}
            onError={e => e.target.style.display = 'none'}
          />
        </div>
      )}

      {/* Tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Tag cat={category} />
        {item.impact != null && (
          <span style={{ fontSize: 11, color: 'oklch(52% 0.01 260)', background: 'oklch(95% 0.006 80)', border: '1px solid oklch(90% 0.006 80)', borderRadius: 6, padding: '2px 7px', fontWeight: 500 }}>
            impact {item.impact}
          </span>
        )}
      </div>

      {/* Engagement bar */}
      <EngagementBar
        commitId={item.id}
        reactions={reactions}
        userReactions={userReactions}
        commentCount={localCommentCount}
        isStashed={isStashed}
        isAuthor={isOwnPost}
        viewCount={item.viewCount ?? 0}
        onReact={onReact}
        onReplyClick={() => setCommentOpen(p => !p)}
        onStash={onStash}
        onShare={!isOwnPost && onMessage && userId ? () => onMessage(userId) : null}
        compact
      />

      {/* Comments (toggled) */}
      {commentOpen && (
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

// ─── Feed View (full-screen vertical scroll) ──────────────────────────────────
function PostFeedView({ items, onBack, currentUserId, localStashed, onReact, onStash, onMessage, onProfile, reactionState }) {
  const scrollRef = useRef();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)',
        padding: '10px 16px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13.5, fontWeight: 600, color: 'oklch(30% 0.015 260)',
            padding: '4px 0',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'oklch(52% 0.2 260)'}
          onMouseLeave={e => e.currentTarget.style.color = 'oklch(30% 0.015 260)'}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4L6 9l5 5" />
          </svg>
          Explore
        </button>
      </div>

      {/* Scrollable feed */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 'var(--feed-max-width, 680px)', margin: '0 auto', padding: '20px 16px 80px' }}>
          {items.map((item) => (
            <div key={item.id}>
              <PostCard
                item={item}
                currentUserId={currentUserId}
                isStashed={localStashed.has(item.id)}
                onReact={onReact}
                onStash={onStash}
                onMessage={onMessage}
                onProfile={onProfile}
                reactionOverride={reactionState[item.id]}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── People card (search results) ────────────────────────────────────────────
function UserCard({ user, onMessage, onProfile }) {
  const ini = userInitials(user);
  const color = userColor(user.id);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 12, border: '1px solid oklch(91% 0.006 80)', marginBottom: 8 }}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={ini} onClick={() => onProfile?.(user.username || user.id)}
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: onProfile ? 'pointer' : 'default' }}
            referrerPolicy="no-referrer" />
        : <div onClick={() => onProfile?.(user.username || user.id)}
            style={{ width: 44, height: 44, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0, cursor: onProfile ? 'pointer' : 'default' }}>
            {ini}
          </div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div onClick={() => onProfile?.(user.username || user.id)}
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

// ─── Main View ────────────────────────────────────────────────────────────────
export default function ExploreView({ onMessage, onProfile, currentUser, stashedIds = [], onStashChange }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('trending');
  const [catFilter, setCatFilter] = useState('All');
  const [users, setUsers] = useState([]);
  const [followed, setFollowed] = useState(new Set());
  const [reactionState, setReactionState] = useState({});
  const [localStashed, setLocalStashed] = useState(new Set(stashedIds));
  const [feedView, setFeedView] = useState(false);
  const [feedItems, setFeedItems] = useState([]);

  useEffect(() => { setLocalStashed(new Set(stashedIds)); }, [stashedIds]);

  const { data: feed = [], isLoading: loading, isError, refetch: refetchFeed } = useQuery({
    queryKey: QUERY_KEYS.exploreFeed(tab),
    queryFn: () => api.getExploreFeed({ limit: 60, type: tab === 'whatifs' ? 'whatifs' : undefined }),
    staleTime: 60_000,
  });
  const error = isError ? 'Failed to load feed' : null;

  const { data: suggestedUsers = [] } = useQuery({
    queryKey: QUERY_KEYS.suggestedUsers,
    queryFn: () => api.getSuggestedUsers(12),
    staleTime: 120_000,
    onSuccess: (data) => {
      setFollowed(new Set(data.filter(u => u.isFollowing).map(u => u.id)));
    },
  });

  // Seed followed set when suggestedUsers loads
  useEffect(() => {
    if (suggestedUsers.length > 0) {
      setFollowed(new Set(suggestedUsers.filter(u => u.isFollowing).map(u => u.id)));
    }
  }, [suggestedUsers]);

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
    api.reactToDecision(id, type).then(result => {
      setReactionState(prev => ({
        ...prev,
        [id]: {
          reactions: { ...(prev[id]?.reactions || {}), [type]: result.count },
          userReactions: { ...(prev[id]?.userReactions || {}), [type]: result.reacted },
        },
      }));
    }).catch(() => {
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

  const loadFeed = useCallback(() => { refetchFeed(); }, [refetchFeed]);

  useEffect(() => {
    if (!search.trim()) { setUsers([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await api.searchUsers(search.trim());
        setUsers(data.filter(u => u.id !== user?.id));
      } catch {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, user?.id]);

  const shownItems = feed.filter(item => {
    const category = inferCategory(item.decision);
    const matchesCat = catFilter === 'All' || category === catFilter;
    const matchesSearch = !search.trim() ||
      item.decision?.toLowerCase().includes(search.toLowerCase()) ||
      item.userInfo?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.userInfo?.username?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const sortedItems = tab === 'trending'
    ? [...shownItems].sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
    : shownItems;

  const toggleFollow = async (id) => {
    const wasFollowing = followed.has(id);
    setFollowed(prev => { const next = new Set(prev); wasFollowing ? next.delete(id) : next.add(id); return next; });
    try {
      wasFollowing ? await api.unfollowUser(id) : await api.followUser(id);
    } catch {
      setFollowed(prev => { const next = new Set(prev); wasFollowing ? next.add(id) : next.delete(id); return next; });
    }
  };

  const openFeed = (item) => {
    const rest = sortedItems.filter(i => i.id !== item.id);
    setFeedItems([item, ...rest]);
    setFeedView(true);
  };

  // ── Feed view ──
  if (feedView) {
    return (
      <PostFeedView
        items={feedItems}
        onBack={() => setFeedView(false)}
        currentUserId={currentUser?.id || currentUser?._id}
        localStashed={localStashed}
        onReact={handleReact}
        onStash={handleStash}
        onMessage={onMessage}
        onProfile={onProfile}
        reactionState={reactionState}
      />
    );
  }

  // ── Grid view ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', padding: 'clamp(10px, 2vw, 12px) var(--explore-h-padding, 28px)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="oklch(62% 0.01 260)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6.8" cy="6.8" r="4.3" />
            <line x1="10" y1="10" x2="14" y2="14" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search decisions, people, branches..."
            style={{ width: '100%', padding: '9px 36px 9px 36px', borderRadius: 10, border: '1px solid oklch(88% 0.008 260)', fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', background: 'oklch(98.5% 0.005 80)', color: 'oklch(18% 0.015 260)', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'}
            onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="oklch(60% 0.01 260)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '100%', padding: 'clamp(14px, 3vw, 18px) var(--explore-h-padding, 28px) 80px' }}>

          {/* Suggested people */}
          {!search && suggestedUsers.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 12, padding: '0 2px' }}>Suggested people</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                {suggestedUsers.map(u => {
                  const ini = userInitials(u);
                  const color = userColor(u.id);
                  const isFollowed = followed.has(u.id);
                  return (
                    <div key={u.id} style={{ flexShrink: 0, width: 160, background: 'white', border: '1px solid oklch(91% 0.006 80)', borderRadius: 14, padding: '18px 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 4px oklch(70% 0.01 260 / 0.06)', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 14px oklch(70% 0.01 260 / 0.12)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px oklch(70% 0.01 260 / 0.06)'}>
                      <div onClick={() => onProfile?.(u.username || u.id)}
                        style={{ width: 54, height: 54, borderRadius: '50%', marginBottom: 10, position: 'relative', cursor: onProfile ? 'pointer' : 'default', flexShrink: 0 }}>
                        {u.avatarUrl
                          ? <img src={u.avatarUrl} alt={ini} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                          : <div style={{ width: 54, height: 54, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'white' }}>{ini}</div>
                        }
                        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: 'oklch(58% 0.18 155)', border: '2px solid white' }} />
                      </div>
                      <div onClick={() => onProfile?.(u.username || u.id)}
                        style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 2, lineHeight: 1.2, cursor: onProfile ? 'pointer' : 'default' }}
                        onMouseEnter={e => { if (onProfile) e.currentTarget.style.textDecoration = 'underline'; }}
                        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
                        {(() => { const parts = (u.fullName || u.username || '').split(' '); return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : parts[0]; })()}
                      </div>
                      <div style={{ fontSize: 11, color: 'oklch(58% 0.01 260)', textAlign: 'center', marginBottom: (u.mutualCount > 0 || (!u.mutualCount && u.followerCount > 0)) ? 4 : 12 }}>{u.commitCount} commits</div>
                      {u.mutualCount > 0 ? (
                        <div style={{ fontSize: 10.5, color: 'oklch(45% 0.18 155)', textAlign: 'center', marginBottom: 12, fontWeight: 500 }}>
                          {u.mutualCount} mutual
                        </div>
                      ) : u.followerCount > 0 ? (
                        <div style={{ fontSize: 10.5, color: 'oklch(55% 0.01 260)', textAlign: 'center', marginBottom: 12 }}>
                          {fmt(u.followerCount)} followers
                        </div>
                      ) : null}
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

          {/* Tabs + category filters */}
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
                {[['trending', '🔥  Trending'], ['whatifs', '⎇  What-ifs']].map(([id, lbl]) => (
                  <button key={id} onClick={() => setTab(id)}
                    style={{ flex: 1, padding: 7, borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, background: tab === id ? 'oklch(52% 0.2 260)' : 'transparent', color: tab === id ? 'white' : 'oklch(50% 0.01 260)', cursor: 'pointer', transition: 'all 0.14s' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* People search results */}
          {search && users.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 11, padding: '0 2px' }}>People</div>
              {users.map(u => <UserCard key={u.id} user={u} onMessage={u.id !== user?.id ? onMessage : null} onProfile={u.id !== user?.id ? onProfile : null} />)}
              {sortedItems.length > 0 && (
                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 11, marginTop: 22, padding: '0 2px' }}>Decisions</div>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ paddingBottom: '100%', borderRadius: 4, background: 'oklch(94% 0.005 260)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(55% 0.18 20)' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{error}</div>
              <button onClick={loadFeed} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 8, border: '1px solid oklch(88% 0.008 260)', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                Retry
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && sortedItems.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {sortedItems.map(item => (
                <GridTile key={item.id} item={item} onClick={openFeed} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && sortedItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(58% 0.01 260)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <svg width="36" height="36" viewBox="0 0 16 16" fill="none" stroke="oklch(72% 0.01 260)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6.8" cy="6.8" r="4.3" />
                  <line x1="10" y1="10" x2="14" y2="14" />
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {feed.length === 0 ? 'No decisions shared yet. Be the first!' : 'No results found'}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
