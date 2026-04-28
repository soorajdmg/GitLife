import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DAY_LABELS, CELL_COLORS } from '../data/gitlife';
import { api } from '../config/api';
import { QUERY_KEYS } from '../config/queryClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import BranchPill from '../components/ui/BranchPill';
import Tag from '../components/ui/Tag';
import EngagementBar from '../components/ui/EngagementBar';
import CommentThread from '../components/ui/CommentThread';

const BRANCH_COLORS = [
  'oklch(52% 0.2 260)',
  'oklch(60% 0.19 55)',
  'oklch(56% 0.2 330)',
  'oklch(52% 0.18 200)',
  'oklch(55% 0.18 140)',
];

function fmt(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ── Shared helpers (mirrors ExploreView) ──────────────────────────────────────
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
    Career:        { bg: 'linear-gradient(135deg, oklch(28% 0.15 260) 0%, oklch(20% 0.1 260) 100%)', text: 'oklch(88% 0.08 260)' },
    Health:        { bg: 'linear-gradient(135deg, oklch(28% 0.14 155) 0%, oklch(20% 0.1 155) 100%)', text: 'oklch(88% 0.08 155)' },
    Relationships: { bg: 'linear-gradient(135deg, oklch(28% 0.14 330) 0%, oklch(20% 0.1 330) 100%)', text: 'oklch(88% 0.08 330)' },
    Finance:       { bg: 'linear-gradient(135deg, oklch(28% 0.14 60) 0%, oklch(20% 0.1 60) 100%)',   text: 'oklch(88% 0.08 60)' },
    Education:     { bg: 'linear-gradient(135deg, oklch(28% 0.14 200) 0%, oklch(20% 0.1 200) 100%)', text: 'oklch(88% 0.08 200)' },
    Travel:        { bg: 'linear-gradient(135deg, oklch(28% 0.14 25) 0%, oklch(20% 0.1 25) 100%)',   text: 'oklch(88% 0.08 25)' },
    Housing:       { bg: 'linear-gradient(135deg, oklch(28% 0.14 80) 0%, oklch(20% 0.1 80) 100%)',   text: 'oklch(88% 0.08 80)' },
  };
  return map[category] || { bg: 'linear-gradient(135deg, oklch(22% 0.03 260) 0%, oklch(15% 0.02 260) 100%)', text: 'oklch(82% 0.04 260)' };
}

// ── Grid Tile (same as ExploreView) ──────────────────────────────────────────
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
        position: 'relative', width: '100%', paddingBottom: '100%',
        cursor: 'pointer', borderRadius: 4, overflow: 'hidden',
        background: hasImage ? '#000' : bg, flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {hasImage ? (
          <img src={item.image || item.img} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => e.target.style.display = 'none'} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', boxSizing: 'border-box' }}>
            {category && (
              <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: text, opacity: 0.7 }}>
                {category}
              </div>
            )}
            {wi && (
              <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: 'oklch(80% 0.1 60)', background: 'oklch(25% 0.1 55 / 0.6)', borderRadius: 4, padding: '2px 5px' }}>
                ⎇ what-if
              </div>
            )}
            <p style={{ color: 'white', fontSize: 'clamp(11px, 2.5vw, 15px)', fontWeight: 700, lineHeight: 1.35, textAlign: 'center', margin: 0, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.decision}
            </p>
          </div>
        )}
      </div>
      {/* Hover overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'oklch(10% 0.02 260 / 0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: hovered ? 1 : 0, transition: 'opacity 0.18s' }}>
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

// ── Post Card (for the feed view) ─────────────────────────────────────────────
function PostCard({ item, currentUserId, isStashed, onReact, onStash, onMessage, onProfile, reactionOverride, onDelete, isOwnProfile }) {
  const user = item.userInfo;
  const ini = userInitials(user);
  const color = userColor(item.userId);
  const wi = isWhatIf(item.branch_name);
  const category = item.type || inferCategory(item.decision);
  const userId = user?._id ? user._id.toString() : item.userId;
  const userHandle = user?.username || null;
  const isOwnPost = currentUserId && currentUserId === item.userId;
  const [localCommentCount, setLocalCommentCount] = useState(item.commentCount ?? 0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 16px oklch(70% 0.01 260 / 0.1)'; setHovered(true); }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; setHovered(false); }}
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
          ? <img src={user.avatarUrl} alt={ini} onClick={() => onProfile?.(userHandle || userId)} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} referrerPolicy="no-referrer" />
          : <div onClick={() => onProfile?.(userHandle || userId)} style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, cursor: 'pointer' }}>{ini}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            onClick={() => onProfile?.(userHandle || userId)}
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
        {isOwnPost && onDelete && (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }} title="More options"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: menuOpen ? 'oklch(93% 0.006 260)' : 'transparent', color: 'oklch(55% 0.01 260)', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: hovered || menuOpen ? 1 : 0, transition: 'opacity 0.15s, background 0.12s' }}>
              <svg width="15" height="15" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="2.5" r="1.2" /><circle cx="7" cy="7" r="1.2" /><circle cx="7" cy="11.5" r="1.2" /></svg>
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'white', border: '1px solid oklch(91% 0.006 80)', borderRadius: 10, boxShadow: '0 4px 20px oklch(25% 0.05 260 / 0.12)', zIndex: 200, overflow: 'hidden', minWidth: 140 }}>
                <button onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(item.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', fontSize: 12.5, fontWeight: 500, color: 'oklch(45% 0.2 25)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.01 25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M5.5 6v4.5M8.5 6v4.5M3.5 3.5l.5 8a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-8" /></svg>
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
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
          <img src={item.image || item.img} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 }} onError={e => e.target.style.display = 'none'} />
        </div>
      )}

      {/* Tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Tag cat={category} />
        {item.impact != null && <span style={{ fontSize: 11, color: 'oklch(52% 0.01 260)', background: 'oklch(95% 0.006 80)', border: '1px solid oklch(90% 0.006 80)', borderRadius: 6, padding: '2px 7px', fontWeight: 500 }}>impact {item.impact}</span>}
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
        <CommentThread decisionId={item.id} currentUserId={currentUserId} initialCount={localCommentCount} onCountChange={delta => setLocalCommentCount(p => Math.max(0, p + delta))} />
      )}
    </div>
  );
}

// ── Profile Feed View ─────────────────────────────────────────────────────────
function ProfileFeedView({ items, startId, onBack, currentUserId, localStashed, onReact, onStash, onMessage, onProfile, reactionState, onDelete, isOwnProfile }) {
  const scrollRef = useRef();
  const itemRefs = useRef({});

  useEffect(() => {
    if (!startId || !scrollRef.current) return;
    // Give the DOM a tick to paint then scroll
    setTimeout(() => {
      const el = itemRefs.current[startId];
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 50);
  }, [startId]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', padding: '10px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'oklch(30% 0.015 260)', padding: '4px 0' }}
          onMouseEnter={e => e.currentTarget.style.color = 'oklch(52% 0.2 260)'}
          onMouseLeave={e => e.currentTarget.style.color = 'oklch(30% 0.015 260)'}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4L6 9l5 5" /></svg>
          Profile
        </button>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 'var(--feed-max-width, 680px)', margin: '0 auto', padding: '20px 16px 80px' }}>
          {items.map(item => {
            const id = item.id || item._id;
            return (
            <div key={id} ref={el => { itemRefs.current[id] = el; }}>
              <PostCard
                item={item}
                currentUserId={currentUserId}
                isStashed={localStashed.has(item.id)}
                onReact={onReact}
                onStash={onStash}
                onMessage={onMessage}
                onProfile={onProfile}
                reactionOverride={reactionState[id]}
                onDelete={isOwnProfile ? onDelete : undefined}
                isOwnProfile={isOwnProfile}
              />
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── ACTIVITY GRAPH ─── */
function buildActivityData(commits) {
  // Build 20 weeks of data ending today
  const NUM_WEEKS = 20;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Start = 20 weeks ago, aligned to Monday
  const start = new Date(today);
  start.setDate(start.getDate() - (NUM_WEEKS * 7 - 1));
  // Align start to Monday (day 1)
  const dow = start.getDay(); // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + offset);

  // Count commits per day
  const dayCounts = {};
  commits.forEach(c => {
    if (!c.rawDate) return;
    const d = new Date(c.rawDate);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    dayCounts[key] = (dayCounts[key] || 0) + 1;
  });

  // Build week/day matrix
  const weekData = [];
  const weekMonths = [];
  for (let w = 0; w < NUM_WEEKS; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + w * 7 + d);
      const key = date.toISOString().slice(0, 10);
      const count = dayCounts[key] || 0;
      // Cap visual at 4
      week.push(Math.min(count, 4));
    }
    weekData.push(week);
    // Month label for first day of the week
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + w * 7);
    weekMonths.push(weekStart.toLocaleDateString('en-US', { month: 'short' }));
  }

  return { weekData, weekMonths, graphStart: start };
}

function ActivityGraph({ commitCount, topCategory, commits, compact = false }) {
  const [hovered, setHovered] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const measure = () => setContainerWidth(containerRef.current.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const NUM_WEEKS_DISPLAY = 20;
  const GAP = 2;
  const DAY_COL = 18; // day labels width + margin
  // Always compute cell size to fill container — no scrolling ever
  const CELL = containerWidth > 0
    ? Math.max(6, Math.floor((containerWidth - DAY_COL - 4 - GAP * (NUM_WEEKS_DISPLAY - 1)) / NUM_WEEKS_DISPLAY))
    : 10;

  const { weekData: allWeekData, weekMonths: allWeekMonths, graphStart } = buildActivityData(commits);
  const weekData = allWeekData.slice(-NUM_WEEKS_DISPLAY);
  const weekMonths = allWeekMonths.slice(-NUM_WEEKS_DISPLAY);
  const weekOffset = allWeekData.length - NUM_WEEKS_DISPLAY;

  const getDate = (weekIndex, day) => {
    const actualWeek = weekIndex + weekOffset;
    const d = new Date(graphStart);
    d.setDate(d.getDate() + actualWeek * 7 + day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const monthLabels = [];
  weekMonths.forEach((m, i) => {
    if (i === 0 || m !== weekMonths[i - 1]) monthLabels.push({ week: i, label: m });
  });

  return (
    <div ref={containerRef}>
      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 10 }}>Commit activity</div>
      <div style={{ display: 'flex', gap: compact ? 6 : 8, marginBottom: 12 }}>
        {[[String(commitCount), 'commits'], ['—', 'streak'], [topCategory || '—', 'top area']].map(([val, lbl]) => (
          <div key={lbl} style={{ flex: 1, padding: compact ? '6px 6px' : '7px 8px', background: 'oklch(97% 0.006 260)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: 'oklch(25% 0.015 260)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</div>
            <div style={{ fontSize: compact ? 9 : 10, color: 'oklch(58% 0.01 260)', marginTop: 1 }}>{lbl}</div>
          </div>
        ))}
      </div>
      {/* Dot matrix — always fills container width, never scrolls */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Month labels */}
        <div style={{ marginLeft: DAY_COL + 4, marginBottom: 3, position: 'relative', height: 14 }}>
          {monthLabels.map(({ week, label }) => (
            <div key={week} style={{ position: 'absolute', left: week * (CELL + GAP), fontSize: 9.5, fontWeight: 600, color: 'oklch(58% 0.01 260)', whiteSpace: 'nowrap' }}>{label}</div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display: 'flex', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 4, flexShrink: 0, width: DAY_COL - 4 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ height: CELL, fontSize: 9, color: 'oklch(62% 0.01 260)', lineHeight: `${CELL}px`, textAlign: 'right' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: GAP, flex: 1 }}>
            {weekData.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP, flex: 1 }}>
                {week.map((count, di) => {
                  const isHov = hovered?.week === wi && hovered?.day === di;
                  return (
                    <div key={di}
                      onMouseEnter={() => setHovered({ week: wi, day: di, count, date: getDate(wi, di) })}
                      onMouseLeave={() => setHovered(null)}
                      onTouchStart={() => setHovered({ week: wi, day: di, count, date: getDate(wi, di) })}
                      onTouchEnd={() => setTimeout(() => setHovered(null), 1200)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 2, background: CELL_COLORS[count],
                        transition: 'transform 0.1s',
                        transform: isHov ? 'scale(1.3)' : 'scale(1)',
                        cursor: 'default', position: 'relative', zIndex: isHov ? 2 : 1,
                      }} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Tooltip */}
        {hovered && (
          <div style={{ position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)', background: 'oklch(18% 0.015 260)', color: 'white', padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10, lineHeight: 1.6 }}>
            <div style={{ opacity: 0.65, fontSize: 10 }}>{hovered.date}</div>
            <div>{hovered.count === 0 ? 'No commits' : `${hovered.count} commit${hovered.count > 1 ? 's' : ''}`}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 9.5, color: 'oklch(62% 0.01 260)' }}>Less</span>
        {CELL_COLORS.map((bg, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: bg }} />)}
        <span style={{ fontSize: 9.5, color: 'oklch(62% 0.01 260)' }}>More</span>
      </div>
    </div>
  );
}

/* ─── GIT GRAPH ─── */
function GitGraph({ commits, branches = [] }) {
  const branchNames = [...new Set(commits.map(c => c.branch))];
  const COL = Object.fromEntries(branchNames.map((b, i) => [b, b === 'main' ? 0 : i]));
  const mergedSet = new Set(branches.filter(b => b.merged).map(b => b.name));
  const COLORS = BRANCH_COLORS;
  const CW = 22, RH = 70;
  const svgW = CW * Math.max(branchNames.length, 1) + 4;

  // For each what-if branch, compute which row indices it spans (first to last occurrence)
  // so rows in between (main commits) can draw the pass-through dashed line.
  const branchSpan = {}; // branch -> { first: i, last: i }
  commits.forEach((c, i) => {
    if (!c.wi) return;
    if (!branchSpan[c.branch]) branchSpan[c.branch] = { first: i, last: i };
    else branchSpan[c.branch].last = i;
  });

  return (
    <div>
      {commits.map((c, i) => {
        const col = COL[c.branch] ?? 1;
        const color = c.wi ? COLORS[col % COLORS.length] : COLORS[0];
        const branchColor = COLORS[col % COLORS.length];
        const mainX = CW / 2, cx = col * CW + CW / 2, midY = RH / 2;

        // For the commit's own branch
        const prevSame = commits.slice(0, i).findLast(x => x.branch === c.branch);
        const nextSame = commits.slice(i + 1).find(x => x.branch === c.branch);
        const isFirstInBranch = c.wi && !prevSame;
        const isLastInBranch  = c.wi && !nextSame;
        const hasAboveSame    = c.wi && !!prevSame;
        const hasBelowSame    = c.wi && !!nextSame;

        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'stretch' }}>
            <svg width={svgW} height={RH} style={{ flexShrink: 0, display: 'block' }}>
              {/* Main branch vertical line */}
              <line x1={mainX} y1={0} x2={mainX} y2={RH} stroke="oklch(52% 0.2 260)" strokeWidth={2} />

              {/* Pass-through dashed lines for what-if branches that span across this row */}
              {Object.entries(branchSpan).map(([branch, span]) => {
                if (branch === c.branch) return null; // handled below
                if (i <= span.first || i >= span.last) return null; // not in between
                const bCol = COL[branch] ?? 1;
                const bColor = COLORS[bCol % COLORS.length];
                const bx = bCol * CW + CW / 2;
                return (
                  <line key={`pass-${branch}`} x1={bx} y1={0} x2={bx} y2={RH} stroke={bColor} strokeWidth={1.5} strokeDasharray="5 3" />
                );
              })}

              {/* This commit's own what-if branch connectors.
                  Commits are newest-first (top=newest, bottom=oldest).
                  isFirstInBranch = newest = top tip (open or merged back in).
                  isLastInBranch  = oldest = fork point from main below. */}
              {c.wi && (() => {
                const segments = [];

                // Above the dot → toward newer commits / top of screen
                if (hasAboveSame) {
                  segments.push(
                    <line key="top" x1={cx} y1={0} x2={cx} y2={midY} stroke={branchColor} strokeWidth={1.5} strokeDasharray="5 3" />
                  );
                } else if (isFirstInBranch && mergedSet.has(c.branch)) {
                  // Merged: curve the tip back into main line above
                  segments.push(
                    <path key="merge-in" d={`M ${cx} ${midY} C ${cx} ${midY * 0.4} ${mainX} ${midY * 0.6} ${mainX} 0`} fill="none" stroke={branchColor} strokeWidth={1.5} strokeDasharray="5 3" />
                  );
                } else if (isFirstInBranch) {
                  // Unmerged open tip: extend dashed line upward to show branch is ongoing
                  segments.push(
                    <line key="top-open" x1={cx} y1={0} x2={cx} y2={midY} stroke={branchColor} strokeWidth={1.5} strokeDasharray="5 3" />
                  );
                }

                // Below the dot → toward older commits / bottom of screen
                if (hasBelowSame) {
                  segments.push(
                    <line key="bot" x1={cx} y1={midY} x2={cx} y2={RH} stroke={branchColor} strokeWidth={1.5} strokeDasharray="5 3" />
                  );
                } else if (isLastInBranch) {
                  // Oldest commit: fork curve down to main line below (the branch origin)
                  segments.push(
                    <path key="fork-off" d={`M ${cx} ${midY} C ${cx} ${midY + (RH - midY) * 0.6} ${mainX} ${midY + (RH - midY) * 0.4} ${mainX} ${RH}`} fill="none" stroke={branchColor} strokeWidth={1.5} strokeDasharray="5 3" />
                  );
                }

                return segments;
              })()}

              {c.wi ? (
                <><circle cx={cx} cy={midY} r={6} fill="white" stroke={color} strokeWidth={2} /><circle cx={cx} cy={midY} r={2.5} fill={color} /></>
              ) : (
                <circle cx={cx} cy={midY} r={6} fill={color} stroke="white" strokeWidth={2} />
              )}
            </svg>
            <div style={{ flex: 1, padding: `${(RH - 52) / 2}px 0 ${(RH - 52) / 2}px 14px`, borderBottom: i < commits.length - 1 ? '1px solid oklch(96% 0.004 80)' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: c.wi ? 'oklch(45% 0.18 55)' : 'oklch(15% 0.015 260)' }}>{c.message}</span>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'oklch(60% 0.008 260)', fontFamily: "'JetBrains Mono', monospace" }}>{c.date}</span>
                <Tag cat={c.category} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── COMMIT LOG ─── */
function CommitLogItem({ c, index, total, currentUserId, isOwnProfile }) {
  const color = c.wi ? 'oklch(60% 0.19 55)' : 'oklch(52% 0.2 260)';
  const [replyOpen, setReplyOpen] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(c.commentCount ?? 0);
  const [reactions, setReactions] = useState({
    fork:    c.reactions?.fork?.count    ?? 0,
    merge:   c.reactions?.merge?.count   ?? 0,
    support: c.reactions?.support?.count ?? 0,
  });
  const [userReactions, setUserReactions] = useState(c.userReactions || {});

  const handleReact = (id, type) => {
    const wasActive = userReactions[type];
    setReactions(prev => ({ ...prev, [type]: prev[type] + (wasActive ? -1 : 1) }));
    setUserReactions(prev => ({ ...prev, [type]: !wasActive }));
    api.reactToDecision(id, type).then(result => {
      setReactions(prev => ({ ...prev, [type]: result.count }));
      setUserReactions(prev => ({ ...prev, [type]: result.reacted }));
    }).catch(() => {
      setReactions(prev => ({ ...prev, [type]: prev[type] + (wasActive ? 1 : -1) }));
      setUserReactions(prev => ({ ...prev, [type]: wasActive }));
    });
  };

  return (
    <div key={c.id} style={{ padding: '14px 0', borderBottom: index < total - 1 ? '1px solid oklch(96% 0.004 80)' : 'none' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ width: 3, borderRadius: 2, background: color, flexShrink: 0, alignSelf: 'stretch', opacity: c.wi ? 0.6 : 1 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 5 }}>
            <BranchPill name={c.branch === 'main' ? 'main' : c.branch.replace('what-if/', '')} wi={c.wi} merged={false} />
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 5, color: c.wi ? 'oklch(45% 0.18 55)' : 'oklch(15% 0.015 260)', lineHeight: 1.35 }}>{c.message}</div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'oklch(60% 0.008 260)', fontFamily: "'JetBrains Mono', monospace" }}>{c.date}</span>
            <Tag cat={c.category} />
          </div>
          <EngagementBar
            commitId={c.id}
            reactions={reactions}
            userReactions={userReactions}
            commentCount={localCommentCount}
            isStashed={false}
            isAuthor={isOwnProfile}
            viewCount={c.viewCount}
            onReact={handleReact}
            onReplyClick={() => setReplyOpen(p => !p)}
            onStash={null}
            onShare={null}
            compact
          />
          {replyOpen && (
            <CommentThread
              decisionId={c.id}
              currentUserId={currentUserId}
              initialCount={localCommentCount}
              onCountChange={delta => setLocalCommentCount(p => Math.max(0, p + delta))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CommitLog({ commits, currentUserId, isOwnProfile }) {
  return (
    <div>
      {commits.map((c, i) => (
        <CommitLogItem key={c.id} c={c} index={i} total={commits.length} currentUserId={currentUserId} isOwnProfile={isOwnProfile} />
      ))}
    </div>
  );
}

/* ─── HORIZONTAL TIMELINE ─── */
function HorizTimeline({ commits }) {
  const main = commits.filter(c => c.branch === 'main');
  const branches = commits.filter(c => c.branch !== 'main');
  const NW = 190, totalW = Math.max(main.length * NW + 60, 700);
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
      <div style={{ width: totalW, position: 'relative', height: 240 }}>
        <div style={{ position: 'absolute', top: 80, left: 40, width: totalW - 60, height: 2, background: 'oklch(52% 0.2 260)', borderRadius: 1 }} />
        {main.map((c, i) => {
          const x = 40 + i * NW;
          const forks = branches.filter(b => {
            const bi = commits.indexOf(b), ci = commits.indexOf(c), ni = commits.indexOf(main[i + 1]);
            return bi > ci && (ni === -1 || bi < ni);
          });
          return (
            <div key={c.id} style={{ position: 'absolute', top: 0, left: x }}>
              <div style={{ position: 'absolute', top: 72, left: -7, width: 16, height: 16, borderRadius: '50%', background: 'oklch(52% 0.2 260)', border: '3px solid white', boxShadow: '0 0 0 2px oklch(52% 0.2 260)' }} />
              <div style={{ position: 'absolute', top: 98, left: -NW / 2 + 10, width: NW - 20, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(15% 0.015 260)', lineHeight: 1.35, marginBottom: 3 }}>{c.message}</div>
                <div style={{ fontSize: 10, color: 'oklch(60% 0.008 260)', marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{c.date}</div>
                <Tag cat={c.category} />
              </div>
              {forks.map((f, fi) => (
                <div key={f.id} style={{ position: 'absolute', top: 80 - (fi + 1) * 60 - 14, left: 0 }}>
                  <div style={{ position: 'absolute', bottom: 14, left: 0, width: NW * 0.55, height: 1.5, background: 'oklch(60% 0.19 55)', opacity: 0.7 }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 0, width: 13, height: 13, borderRadius: '50%', background: 'white', border: `2px solid oklch(60% 0.19 55)` }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 5, height: 5, borderRadius: '50%', background: 'oklch(60% 0.19 55)' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 22, left: 0, width: NW * 0.8, fontSize: 11, color: 'oklch(45% 0.18 55)', fontWeight: 500, lineHeight: 1.3 }}>{f.message}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── PROFILE VIEW ─── */
export default function ProfileView({ viz, username, onProfile, onMessage, currentUser, stashedIds = [], onStashChange }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isOwnProfile = !username || username === user?.username;
  const [activeBranch, setActiveBranch] = useState('all');
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [feedView, setFeedView] = useState(false);
  const [feedStartId, setFeedStartId] = useState(null);
  const [reactionState, setReactionState] = useState({});
  const [localStashed, setLocalStashed] = useState(new Set(stashedIds));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => { setLocalStashed(new Set(stashedIds)); }, [stashedIds]);

  // Own profile: fetch decisions + branches in parallel
  const { data: ownDecisions = [], isLoading: ownDecisionsLoading } = useQuery({
    queryKey: QUERY_KEYS.decisions,
    queryFn: () => api.getDecisions({ sortOrder: 'desc' }),
    enabled: isOwnProfile,
    staleTime: 30_000,
  });
  const { data: ownBranches = [], isLoading: ownBranchesLoading } = useQuery({
    queryKey: QUERY_KEYS.branches,
    queryFn: () => api.getBranches(),
    enabled: isOwnProfile,
    staleTime: 60_000,
  });

  // Other profile: fetch profile first, then decisions (dependent query)
  const { data: otherProfile, isLoading: otherProfileLoading } = useQuery({
    queryKey: QUERY_KEYS.profile(username),
    queryFn: () => api.getUserProfile(username),
    enabled: !isOwnProfile && !!username,
    staleTime: 60_000,
  });
  const resolvedUserId = otherProfile ? (otherProfile.id || otherProfile._id || username) : null;
  const { data: otherDecisions = [], isLoading: otherDecisionsLoading } = useQuery({
    queryKey: QUERY_KEYS.userDecisions(resolvedUserId),
    queryFn: () => api.getUserDecisions(resolvedUserId),
    enabled: !isOwnProfile && !!resolvedUserId,
    staleTime: 30_000,
  });

  // Sync isFollowing from profile data
  const otherUser = otherProfile || null;
  useEffect(() => {
    if (otherProfile) setIsFollowing(otherProfile.isFollowing);
  }, [otherProfile]);

  // Derive loading, rawDecisions, commits, branches from query data
  const loading = isOwnProfile
    ? (ownDecisionsLoading || ownBranchesLoading)
    : (otherProfileLoading || (!!resolvedUserId && otherDecisionsLoading));

  const rawDecisions = isOwnProfile ? ownDecisions : otherDecisions;

  const commits = isOwnProfile
    ? ownDecisions.map(d => ({
        id: d.id,
        branch: d.branch_name,
        message: d.decision,
        date: formatDate(d.timestamp),
        rawDate: d.timestamp,
        category: d.type || 'Career',
        wi: d.branch_name !== 'main',
        merged: false,
        reactions: d.reactions || { fork: { count: 0 }, merge: { count: 0 }, support: { count: 0 } },
        userReactions: d.userReactions || {},
        commentCount: d.commentCount ?? 0,
        viewCount: d.viewCount ?? 0,
      }))
    : otherDecisions.map(d => ({
        id: d.id,
        branch: d.branch_name,
        message: d.decision,
        date: formatDate(d.timestamp),
        rawDate: d.timestamp,
        category: d.type || 'Career',
        wi: d.branch_name !== 'main',
        merged: false,
        reactions: d.reactions || { fork: { count: 0 }, merge: { count: 0 }, support: { count: 0 } },
        userReactions: d.userReactions || {},
        commentCount: d.commentCount ?? 0,
        viewCount: d.viewCount ?? 0,
      }));

  const branches = (() => {
    if (isOwnProfile && ownBranches.length > 0) {
      // Use API branches, but merge in any branch names from commits that aren't already listed
      const apiNames = new Set(ownBranches.map(b => b.name));
      const extraNames = [...new Set(commits.map(d => d.branch).filter(Boolean))]
        .filter(name => !apiNames.has(name));
      const all = [
        ...ownBranches.map((b, i) => ({
          id: b.id,
          name: b.name,
          color: BRANCH_COLORS[i % BRANCH_COLORS.length],
          merged: b.status === 'merged',
        })),
        ...extraNames.map((name, i) => ({
          id: name,
          name,
          color: BRANCH_COLORS[(ownBranches.length + i) % BRANCH_COLORS.length],
          merged: false,
        })),
      ];
      return all;
    }
    // Derive branches from commits (own profile fallback + other profiles)
    const branchNames = [...new Set(commits.map(d => d.branch).filter(Boolean))];
    return branchNames.map((name, i) => ({
      id: name,
      name,
      color: BRANCH_COLORS[i % BRANCH_COLORS.length],
      merged: false,
    }));
  })();

  // Reset active branch when profile changes
  useEffect(() => { setActiveBranch('all'); }, [username, isOwnProfile]);

  const handleReact = (id, type) => {
    setReactionState(prev => {
      const item = rawDecisions.find(d => (d.id || d._id) === id);
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
        [id]: { reactions: { ...(prev[id]?.reactions || {}), [type]: result.count }, userReactions: { ...(prev[id]?.userReactions || {}), [type]: result.reacted } },
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

  const openFeed = (item) => {
    setFeedStartId(item.id || item._id);
    setFeedView(true);
  };

  const queryClient = useQueryClient();
  const handleDeletePost = async (id) => {
    try {
      await api.deleteDecision(id);
      if (isOwnProfile) {
        queryClient.setQueryData(QUERY_KEYS.decisions, (old = []) => old.filter(d => (d.id || d._id) !== id));
      } else {
        queryClient.setQueryData(QUERY_KEYS.userDecisions(resolvedUserId), (old = []) => old.filter(d => (d.id || d._id) !== id));
      }
      addToast({ message: 'Post deleted', type: 'success' });
    } catch {
      addToast({ message: 'Failed to delete post', type: 'error' });
    }
  };

  const toggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowUser(resolvedUserId || username);
        setIsFollowing(false);
        setOtherUser(prev => prev ? { ...prev, followerCount: Math.max(0, (prev.followerCount || 1) - 1) } : prev);
      } else {
        await api.followUser(resolvedUserId || username);
        setIsFollowing(true);
        setOtherUser(prev => prev ? { ...prev, followerCount: (prev.followerCount || 0) + 1 } : prev);
      }
    } catch {
      // ignore
    } finally {
      setFollowLoading(false);
    }
  };

  const allBranches = [{ id: 'all', name: 'all', color: 'oklch(80% 0.01 260)', merged: false }, ...branches];
  const shown = activeBranch === 'all' ? commits : commits.filter(c => {
    const b = branches.find(br => br.id === activeBranch);
    return b && c.branch === b.name;
  });

  const Viz = { graph: GitGraph, log: CommitLog, horizontal: HorizTimeline }[viz] || GitGraph;

  const topCategory = commits.length > 0
    ? Object.entries(commits.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  // Derive display info
  const profileData = isOwnProfile ? user : otherUser;
  const displayName = profileData?.fullName || profileData?.username || (isOwnProfile ? profileData?.email?.split('@')[0] : null) || 'User';
  const handle = profileData?.username ? `@${profileData.username}` : (isOwnProfile && profileData?.email ? `@${profileData.email.split('@')[0]}` : '@user');
  const initials = displayName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = 'oklch(52% 0.2 260)';
  const avatarUrl = profileData?.avatarUrl;

  // Sort decisions by date (newest first) for the feed
  // Inject userInfo from profileData when the backend doesn't populate it (own profile)
  const fallbackUserInfo = profileData ? {
    fullName: profileData.fullName,
    username: profileData.username,
    avatarUrl: profileData.avatarUrl,
  } : null;
  const sortedDecisions = [...rawDecisions]
    .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
    .map(d => (!d.userInfo && fallbackUserInfo) ? { ...d, userInfo: fallbackUserInfo } : d);

  // Active branch display name
  const activeBranchData = allBranches.find(b => b.id === activeBranch);

  // ── Feed view (full-screen) ──
  if (feedView) {
    return (
      <ProfileFeedView
        items={sortedDecisions}
        startId={feedStartId}
        onBack={() => setFeedView(false)}
        currentUserId={currentUser?.id || currentUser?._id || user?.id}
        localStashed={localStashed}
        onReact={handleReact}
        onStash={handleStash}
        onMessage={onMessage}
        onProfile={onProfile}
        reactionState={reactionState}
        onDelete={handleDeletePost}
        isOwnProfile={isOwnProfile}
      />
    );
  }

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: 'oklch(98% 0.004 260)' }}>
        {/* Mobile Header */}
        <div style={{ background: 'white', borderBottom: '1px solid oklch(92% 0.006 80)', padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize: 11.5, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>{handle}</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {isOwnProfile ? (
                  [['commits', commits.length], ['branches', branches.length]].map(([lbl, val]) => (
                    <div key={lbl} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{fmt(val)}</div>
                      <div style={{ fontSize: 10.5, color: 'oklch(58% 0.01 260)', marginTop: 1 }}>{lbl}</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{fmt(otherUser?.commitCount ?? commits.length)}</div>
                      <div style={{ fontSize: 10.5, color: 'oklch(58% 0.01 260)', marginTop: 1 }}>commits</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{fmt(otherUser?.followerCount ?? 0)}</div>
                      <div style={{ fontSize: 10.5, color: 'oklch(58% 0.01 260)', marginTop: 1 }}>followers</div>
                    </div>
                    <button onClick={toggleFollow} disabled={followLoading}
                      style={{ padding: '6px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: followLoading ? 'default' : 'pointer', border: isFollowing ? '1.5px solid oklch(88% 0.008 260)' : 'none', background: isFollowing ? 'white' : 'oklch(52% 0.2 260)', color: isFollowing ? 'oklch(42% 0.2 260)' : 'white' }}>
                      {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 12px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── 1. Commit Activity ── */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)', padding: '14px 14px 18px', overflow: 'hidden' }}>
            <ActivityGraph commitCount={commits.length} topCategory={topCategory} commits={commits} compact />
          </div>

          {/* ── 2. Branch Dropdown ── */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)', padding: '14px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 9 }}>Branch</div>
            {loading ? (
              <div style={{ height: 40, background: 'oklch(95% 0.006 80)', borderRadius: 10 }} />
            ) : (
              <div style={{ position: 'relative' }}>
                <select
                  value={activeBranch}
                  onChange={e => setActiveBranch(e.target.value)}
                  style={{
                    width: '100%', appearance: 'none', WebkitAppearance: 'none',
                    padding: '10px 36px 10px 12px', borderRadius: 10, fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                    border: '1.5px solid oklch(88% 0.01 260)',
                    background: 'oklch(97% 0.006 260)', color: 'oklch(18% 0.015 260)',
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  {allBranches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.merged ? ' (merged)' : ''}
                    </option>
                  ))}
                </select>
                {/* Chevron icon */}
                <div style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'oklch(50% 0.01 260)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 5l4 4 4-4" />
                  </svg>
                </div>
                {/* Active branch color dot */}
                {activeBranchData && (
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    {/* dot overlaid on the select — hidden since select manages its own rendering */}
                  </div>
                )}
              </div>
            )}
            {/* Branch pills row - quick filter chips */}
            {!loading && branches.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {allBranches.slice(0, 5).map(b => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBranch(b.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20, fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                      border: activeBranch === b.id ? `1.5px solid ${b.color}` : '1.5px solid oklch(90% 0.006 80)',
                      background: activeBranch === b.id ? `${b.color}22` : 'oklch(97% 0.004 80)',
                      color: activeBranch === b.id ? b.color : 'oklch(50% 0.01 260)',
                      cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0,
                    }}
                  >
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                    {b.name === 'all' ? 'all' : b.name.replace('what-if/', '⎇ ')}
                    {b.merged && <span style={{ fontSize: 9, opacity: 0.7 }}> ✓</span>}
                  </button>
                ))}
                {allBranches.length > 5 && (
                  <span style={{ fontSize: 11, color: 'oklch(58% 0.01 260)', padding: '4px 6px', alignSelf: 'center' }}>+{allBranches.length - 5} more</span>
                )}
              </div>
            )}
          </div>

          {/* ── 3. Git Graph ── */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)', padding: '14px', overflow: 'hidden' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 14 }}>
              {{ graph: 'Git Graph', log: 'Commit Log', horizontal: 'Timeline' }[viz] || 'Git Graph'}
            </div>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid oklch(96% 0.004 80)' }}>
                  <div style={{ width: 36, height: 36, background: 'oklch(94% 0.006 80)', borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: '60%', background: 'oklch(93% 0.006 80)', borderRadius: 5, marginBottom: 7 }} />
                    <div style={{ height: 9, width: '38%', background: 'oklch(95% 0.004 80)', borderRadius: 5 }} />
                  </div>
                </div>
              ))
            ) : shown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'oklch(58% 0.01 260)', fontSize: 13 }}>
                No commits yet. Start tracking your life decisions!
              </div>
            ) : (
              <div style={{ overflowX: viz === 'horizontal' ? 'auto' : 'visible' }}>
                <Viz commits={shown} branches={branches} currentUserId={user?.id} isOwnProfile={isOwnProfile} />
              </div>
            )}
          </div>

          {/* ── 4. Posts Grid ── */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 10, paddingLeft: 2 }}>
              Posts ({rawDecisions.length})
            </div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} style={{ paddingBottom: '100%', borderRadius: 6, background: 'oklch(94% 0.005 260)' }} />
                ))}
              </div>
            ) : rawDecisions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: 'oklch(58% 0.01 260)', fontSize: 13, background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)' }}>
                No posts yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {sortedDecisions.map(d => (
                  <GridTile key={d.id || d._id} item={d} onClick={openFeed} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 'var(--profile-max-width, 960px)', margin: '0 auto', padding: 'clamp(20px, 3vw, 36px) clamp(20px, 3vw, 40px) 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 1 }}>{displayName}</div>
            <div style={{ fontSize: 12.5, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 7 }}>{handle}</div>
            <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
              {isOwnProfile ? (
                [['commits', commits.length], ['branches', branches.length]].map(([lbl, val]) => (
                  <div key={lbl}><span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(val)}</span> <span style={{ fontSize: 12, color: 'oklch(58% 0.01 260)' }}>{lbl}</span></div>
                ))
              ) : (
                <>
                  <div><span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(otherUser?.commitCount ?? commits.length)}</span> <span style={{ fontSize: 12, color: 'oklch(58% 0.01 260)' }}>commits</span></div>
                  <div><span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(otherUser?.followerCount ?? 0)}</span> <span style={{ fontSize: 12, color: 'oklch(58% 0.01 260)' }}>followers</span></div>
                  <button onClick={toggleFollow} disabled={followLoading}
                    style={{ marginLeft: 8, padding: '5px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: followLoading ? 'default' : 'pointer', border: isFollowing ? '1px solid oklch(88% 0.008 260)' : 'none', background: isFollowing ? 'white' : 'oklch(52% 0.2 260)', color: isFollowing ? 'oklch(42% 0.2 260)' : 'white', transition: 'all 0.12s' }}>
                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(240px, 25%, 320px) 1fr', gap: 'clamp(16px, 2vw, 28px)' }}>
          {/* Left */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 9 }}>Branches</div>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: 28, background: 'oklch(95% 0.006 80)', borderRadius: 8, marginBottom: 4 }} />
              ))
            ) : (
              allBranches.map(b => (
                <div key={b.id} onClick={() => setActiveBranch(b.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: activeBranch === b.id ? 'oklch(95% 0.015 260)' : 'transparent', transition: 'background 0.12s' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, flex: 1, whiteSpace: 'nowrap' }}>{b.name}</span>
                  {b.merged && <span style={{ fontSize: 9, padding: '1px 5px', background: 'oklch(92% 0.05 155)', color: 'oklch(38% 0.18 155)', borderRadius: 3, fontWeight: 600 }}>merged</span>}
                </div>
              ))
            )}
            <div style={{ marginTop: 18, padding: 14, background: 'white', borderRadius: 12, border: '1px solid oklch(91% 0.006 80)' }}>
              <ActivityGraph commitCount={commits.length} topCategory={topCategory} commits={commits} />
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)', padding: '20px 22px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 16 }}>
              {{ graph: 'Git Graph', log: 'Commit Log', horizontal: 'Timeline' }[viz] || 'Git Graph'}
            </div>
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid oklch(96% 0.004 80)' }}>
                  <div style={{ width: 44, height: 44, background: 'oklch(94% 0.006 80)', borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 13, width: '55%', background: 'oklch(93% 0.006 80)', borderRadius: 5, marginBottom: 8 }} />
                    <div style={{ height: 10, width: '35%', background: 'oklch(95% 0.004 80)', borderRadius: 5 }} />
                  </div>
                </div>
              ))
            ) : shown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'oklch(58% 0.01 260)', fontSize: 14 }}>
                No commits yet. Start tracking your life decisions!
              </div>
            ) : (
              <Viz commits={shown} branches={branches} currentUserId={user?.id} isOwnProfile={isOwnProfile} />
            )}
          </div>
        </div>

        {/* Posts grid */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 14 }}>
            Posts ({rawDecisions.length})
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ paddingBottom: '100%', borderRadius: 4, background: 'oklch(94% 0.005 260)' }} />
              ))}
            </div>
          ) : rawDecisions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'oklch(58% 0.01 260)', fontSize: 14, background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)' }}>
              No posts yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {sortedDecisions.map(d => (
                <GridTile key={d.id || d._id} item={d} onClick={openFeed} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
