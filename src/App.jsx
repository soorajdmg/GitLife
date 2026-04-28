import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './config/api';
import { QUERY_KEYS } from './config/queryClient';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { useSocket } from './contexts/SocketContext';
import FeedView from './views/FeedView';
import ExploreView from './views/ExploreView';
import ProfileView from './views/ProfileView';
import MessagesView from './views/MessagesView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import NewCommitModal from './components/ui/NewCommitModal';

/* ─── MOBILE HOOK ─── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

/* ─── SIDEBAR WIDTH HOOK ─── */
function useSidebarWidth() {
  const getWidth = () => {
    const w = window.innerWidth;
    if (w >= 1536) return 290;
    if (w >= 1280) return 260;
    return 230;
  };
  const [width, setWidth] = useState(getWidth);
  useEffect(() => {
    const handler = () => setWidth(getWidth());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

/* ─── NAV ICONS ─── */
function NavIcon({ type, active, size = 22 }) {
  const col = active ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)';
  const fill = active ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)';
  switch (type) {
    case 'feed':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="4" cy="4" r="1.2" fill={fill} stroke="none" /><line x1="7.5" y1="4" x2="13" y2="4" />
          <circle cx="4" cy="8" r="1.2" fill={fill} stroke="none" /><line x1="7.5" y1="8" x2="13" y2="8" />
          <circle cx="4" cy="12" r="1.2" fill={fill} stroke="none" /><line x1="7.5" y1="12" x2="13" y2="12" />
        </svg>
      );
    case 'explore':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" />
          <polygon points="10.5,5.5 6,7 5.5,10.5 10,9" fill={fill} stroke="none" />
        </svg>
      );
    case 'profile':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5.5" r="2.5" />
          <path d="M2.5 13.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" />
        </svg>
      );
    case 'messages':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.5C2 2.7 2.7 2 3.5 2h9C13.3 2 14 2.7 14 3.5v6c0 .8-.7 1.5-1.5 1.5H9l-3 2.5V11H3.5C2.7 11 2 10.3 2 9.5v-6z" />
          <line x1="5" y1="5.5" x2="11" y2="5.5" /><line x1="5" y1="8" x2="8.5" y2="8" />
        </svg>
      );
    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="2" y1="12" x2="14" y2="12" />
          <circle cx="5" cy="4" r="1.5" fill={fill} stroke="none" />
          <circle cx="10" cy="8" r="1.5" fill={fill} stroke="none" />
          <circle cx="6" cy="12" r="1.5" fill={fill} stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

/* Keep legacy NAV_ICONS for compatibility with inline usage */
const NAV_ICONS = {
  feed:     (a) => <NavIcon type="feed"     active={a} />,
  explore:  (a) => <NavIcon type="explore"  active={a} />,
  profile:  (a) => <NavIcon type="profile"  active={a} />,
  messages: (a) => <NavIcon type="messages" active={a} />,
  settings: (a) => <NavIcon type="settings" active={a} />,
  branches: (a) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="3.5" r="1.5" /><circle cx="5" cy="12.5" r="1.5" /><circle cx="11" cy="6.5" r="1.5" />
      <line x1="5" y1="5" x2="5" y2="11" /><path d="M5 5c0 0 0-1.5 6 0" />
    </svg>
  ),
  notifications: (a) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2a4.5 4.5 0 0 1 4.5 4.5c0 2.5.8 3.5 1.5 4H2c.7-.5 1.5-1.5 1.5-4A4.5 4.5 0 0 1 8 2z" />
      <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  ),
};

const NAV = [
  { id: 'feed',     label: 'Feed' },
  { id: 'explore',  label: 'Explore' },
  { id: 'profile',  label: 'My Life' },
  { id: 'messages', label: 'Messages' },
  { id: 'settings', label: 'Settings' },
];

const VIEW_TITLE = { feed: 'Feed', explore: 'Explore', profile: 'My Life', messages: 'Messages', branches: 'Branches', settings: 'Settings', notifications: 'Notifications' };

/* ─── PROFILE ROUTE WRAPPER ─── */
function ProfileViewRoute(props) {
  const { username } = useParams();
  return <ProfileView {...props} username={username || null} />;
}

/* ─── NOTIFICATIONS DROPDOWN ─── */
const NOTIF_TYPE_ICON = { fork: '⎇', merge: '↩', support: '♡', follow: '👤', comment: '💬', reply: '↪' };
const NOTIF_TYPE_BG   = { fork: 'oklch(93% 0.06 60)', merge: 'oklch(93% 0.05 260)', support: 'oklch(93% 0.05 155)', follow: 'oklch(93% 0.05 330)', comment: 'oklch(93% 0.05 60)', reply: 'oklch(93% 0.05 260)' };
const NOTIF_TYPE_FG   = { fork: 'oklch(45% 0.19 55)', merge: 'oklch(42% 0.2 260)', support: 'oklch(40% 0.18 155)', follow: 'oklch(42% 0.18 330)', comment: 'oklch(45% 0.19 55)', reply: 'oklch(42% 0.2 260)' };

function notifAvatarColor(str = '') {
  const colors = ['oklch(52% 0.18 260)', 'oklch(52% 0.18 155)', 'oklch(52% 0.18 55)', 'oklch(52% 0.18 330)', 'oklch(52% 0.18 30)'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function notifInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function notifDropdownMessage(n) {
  const name = n.sender?.fullName || n.sender?.username || 'Someone';
  switch (n.type) {
    case 'follow':  return `${name} started following you`;
    case 'fork':    return `${name} forked your commit`;
    case 'merge':   return `${name} merged your commit`;
    case 'support': return `${name} supported your commit`;
    case 'comment': return `${name} commented on your commit`;
    case 'reply':   return `${name} replied to your comment`;
    default:        return `${name} interacted with you`;
  }
}

function NotifDropdown({ onClose, triggerRef, onNotifsLoaded, onProfile, isMobile }) {
  const queryClient = useQueryClient();
  const { data: notifs = [], isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => api.getNotifications(20),
    staleTime: 60_000,
  });
  const ref = useRef();

  useEffect(() => {
    if (!loading) {
      onNotifsLoaded?.(notifs.filter(n => !n.read).length);
    }
  }, [notifs, loading, onNotifsLoaded]);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target) && !(triggerRef?.current && triggerRef.current.contains(e.target))) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = async () => {
    queryClient.setQueryData(QUERY_KEYS.notifications, (old = []) => old.map(n => ({ ...n, read: true })));
    onNotifsLoaded?.(0);
    await api.markAllNotifsRead().catch(() => {});
  };

  const markOneRead = async (id) => {
    queryClient.setQueryData(QUERY_KEYS.notifications, (old = []) => {
      const updated = old.map(n => n.id === id ? { ...n, read: true } : n);
      onNotifsLoaded?.(updated.filter(n => !n.read).length);
      return updated;
    });
    await api.markNotifRead(id).catch(() => {});
  };

  return (
    <div ref={ref} style={{
      position: 'absolute',
      top: 44,
      right: isMobile ? -8 : 0,
      width: isMobile ? 'calc(100vw - 24px)' : 360,
      maxWidth: isMobile ? 'calc(100vw - 24px)' : 360,
      background: 'white',
      borderRadius: 14,
      boxShadow: '0 8px 40px oklch(25% 0.05 260 / 0.16)',
      border: '1px solid oklch(91% 0.006 80)',
      zIndex: 200,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid oklch(94% 0.004 80)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'oklch(18% 0.015 260)' }}>Notifications</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unreadCount > 0 && <span style={{ fontSize: 11.5, color: 'oklch(42% 0.2 260)', fontWeight: 500 }}>{unreadCount} unread</span>}
          {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize: 11.5, fontWeight: 500, color: 'oklch(42% 0.2 260)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Mark all read</button>}
        </div>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading && <div style={{ padding: '20px 16px', fontSize: 12.5, color: 'oklch(62% 0.01 260)', textAlign: 'center' }}>Loading…</div>}
        {!loading && notifs.length === 0 && <div style={{ padding: '20px 16px', fontSize: 12.5, color: 'oklch(62% 0.01 260)', textAlign: 'center' }}>No notifications yet</div>}
        {notifs.map(n => {
          const senderName = n.sender?.fullName || n.sender?.username || '?';
          const color = notifAvatarColor(n.senderId);
          const ini = notifInitials(senderName);
          return (
            <div key={n.id} onClick={() => markOneRead(n.id)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 16px', background: !n.read ? 'oklch(96.5% 0.012 260)' : 'white', borderBottom: '1px solid oklch(95% 0.004 80)', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = !n.read ? 'oklch(95% 0.018 260)' : 'oklch(98.5% 0.005 80)'}
              onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'oklch(96.5% 0.012 260)' : 'white'}>
              <div
                style={{ position: 'relative', flexShrink: 0, cursor: onProfile && n.senderId ? 'pointer' : 'default' }}
                onClick={e => { if (onProfile && n.sender?.username) { e.stopPropagation(); markOneRead(n.id); onClose(); onProfile(n.sender.username); } }}
              >
                {n.sender?.avatarUrl
                  ? <img src={n.sender.avatarUrl} alt={senderName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{ini}</div>
                }
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: NOTIF_TYPE_BG[n.type] || 'oklch(93% 0.05 260)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: NOTIF_TYPE_FG[n.type] || 'oklch(42% 0.2 260)' }}>{NOTIF_TYPE_ICON[n.type] || '●'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4, marginBottom: (n.decisionText || n.commentText) ? 4 : 0, color: 'oklch(44% 0.01 260)' }}>
                  {notifDropdownMessage(n)}
                </div>
                {(n.commentText || n.decisionText) && (
                  <div style={{ fontSize: 11.5, color: 'oklch(48% 0.01 260)', background: 'oklch(96% 0.006 80)', borderRadius: 6, padding: '3px 8px', display: 'inline-block', marginBottom: 3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{n.commentText || n.decisionText}"
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: 'oklch(62% 0.01 260)', marginTop: 2 }}>{formatRelativeTime(n.createdAt)}</div>
              </div>
              {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(52% 0.2 260)', flexShrink: 0, marginTop: 5 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TWEAKS PANEL ─── */
const TWEAK_DEFAULTS = { timelineViz: 'graph', accentHue: '260', density: 'compact' };

function TweaksPanel({ visible, tweaks, setTweaks }) {
  if (!visible) return null;
  const set = (k, v) => {
    const n = { ...tweaks, [k]: v };
    setTweaks(n);
    window.parent?.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 24, background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 8px 40px oklch(30% 0.05 260 / 0.14)', border: '1px solid oklch(91% 0.006 80)', width: 230, zIndex: 50 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'oklch(32% 0.01 260)' }}>Tweaks</div>
      {[
        { label: 'Timeline view', key: 'timelineViz', opts: [['graph', 'Git Graph'], ['log', 'Commit Log'], ['horizontal', 'Timeline']] },
        { label: 'Density',       key: 'density',     opts: [['comfortable', 'Comfortable'], ['compact', 'Compact']] },
      ].map(g => (
        <div key={g.key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(60% 0.01 260)', marginBottom: 6 }}>{g.label}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {g.opts.map(([val, lbl]) => (
              <button key={val} onClick={() => set(g.key, val)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', border: `1px solid ${tweaks[g.key] === val ? 'oklch(52% 0.2 260)' : 'oklch(88% 0.008 260)'}`, background: tweaks[g.key] === val ? 'oklch(52% 0.2 260)' : 'white', color: tweaks[g.key] === val ? 'white' : 'oklch(48% 0.01 260)', transition: 'all 0.12s' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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


function mapDecisionToCommit(d, stashedIds = []) {
  return {
    id: d.id,
    userId: d.userId || 'alex',
    branch: d.branch_name,
    message: d.decision,
    body: d.body || null,
    category: d.type || 'Career',
    ts: formatRelativeTime(d.timestamp),
    image: d.image || null,
    impact: d.impact ?? null,
    viewCount: d.viewCount ?? 0,
    commentCount: d.commentCount ?? 0,
    rx: {
      fork:    d.reactions?.fork?.count    ?? 0,
      merge:   d.reactions?.merge?.count   ?? 0,
      support: d.reactions?.support?.count ?? 0,
    },
    ur: {
      fork:    d.userReactions?.fork    ?? false,
      merge:   d.userReactions?.merge   ?? false,
      support: d.userReactions?.support ?? false,
    },
    stashed: stashedIds.includes(d.id),
    wi: d.branch_name !== 'main',
    userInfo: d.userInfo || null,
  };
}

/* ─── BOTTOM NAV (mobile) ─── */
function BottomNav({ activeNav, navigate, setModal, unreadMsgCount, user }) {
  const btnBase = {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0', minWidth: 0,
  };
  const labelStyle = (active) => ({
    fontSize: 10, fontWeight: active ? 600 : 500,
    color: active ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)',
    lineHeight: 1,
  });

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: 'white',
      borderTop: '1px solid oklch(91% 0.006 80)',
      display: 'flex', alignItems: 'stretch',
      zIndex: 100,
    }}>
      {/* Feed */}
      <button style={btnBase} onClick={() => navigate('/feed')}>
        <NavIcon type="feed" active={activeNav === 'feed'} size={24} />
        <span style={labelStyle(activeNav === 'feed')}>Feed</span>
      </button>

      {/* Explore */}
      <button style={btnBase} onClick={() => navigate('/explore')}>
        <NavIcon type="explore" active={activeNav === 'explore'} size={24} />
        <span style={labelStyle(activeNav === 'explore')}>Explore</span>
      </button>

      {/* Center [+] New Commit */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => setModal(true)} style={{
          width: 46, height: 46, borderRadius: '50%',
          background: 'oklch(52% 0.2 260)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', padding: 0,
          boxShadow: '0 2px 14px oklch(52% 0.2 260 / 0.45)',
          cursor: 'pointer',
          transform: 'translateY(-6px)',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="11" y1="4" x2="11" y2="18" />
            <line x1="4" y1="11" x2="18" y2="11" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <button style={{ ...btnBase, position: 'relative' }} onClick={() => navigate('/messages')}>
        <div style={{ position: 'relative' }}>
          <NavIcon type="messages" active={activeNav === 'messages'} size={24} />
          {unreadMsgCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -6,
              minWidth: 16, height: 16, borderRadius: 8,
              background: 'oklch(52% 0.2 260)', color: 'white',
              fontSize: 9.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', border: '2px solid white',
            }}>
              {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
            </span>
          )}
        </div>
        <span style={labelStyle(activeNav === 'messages')}>Messages</span>
      </button>

      {/* Profile */}
      <button style={btnBase} onClick={() => navigate('/profile')}>
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="profile"
            referrerPolicy="no-referrer"
            style={{
              width: 26, height: 26, borderRadius: '50%', objectFit: 'cover',
              border: activeNav === 'profile'
                ? '2.5px solid oklch(52% 0.2 260)'
                : '2.5px solid transparent',
            }}
          />
        ) : (
          <NavIcon type="profile" active={activeNav === 'profile'} size={24} />
        )}
        <span style={labelStyle(activeNav === 'profile')}>My Life</span>
      </button>
    </nav>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const socket = useSocket();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const sidebarWidth = useSidebarWidth();
  const [feedData, setFeedData] = useState({ following: [], trending: [], hasFollowing: false });
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedSeeded, setFeedSeeded] = useState(false);
  const [modal, setModal] = useState(false);
  const [tweaksVis, setTweaksVis] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [sidebarFollowing, setSidebarFollowing] = useState([]);
  const [stashedIds, setStashedIds] = useState([]);
  const bellRef = useRef();
  const unreadConvIdsRef = useRef(new Set());
  const settingsSaveRef = useRef(null); // set by SettingsView
  const [settingsHasChanges, setSettingsHasChanges] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Derive active nav from URL
  const activeNav = pathname.startsWith('/explore') ? 'explore'
    : pathname.startsWith('/profile') ? 'profile'
    : pathname.startsWith('/messages') ? 'messages'
    : pathname.startsWith('/settings') ? 'settings'
    : 'feed';

  const openMessage = (userId) => {
    unreadConvIdsRef.current.clear();
    setUnreadMsgCount(0);
    navigate(`/messages?user=${userId}`);
  };
  const openProfile = (username) => {
    if (username) navigate(`/${username}`);
    else navigate('/profile');
  };

  // Unread notif count
  const { data: unreadNotifData } = useQuery({
    queryKey: QUERY_KEYS.unreadNotifCount,
    queryFn: () => api.getUnreadNotifCount(),
    staleTime: 60_000,
  });
  useEffect(() => {
    if (unreadNotifData?.count != null) setUnreadNotifCount(unreadNotifData.count);
  }, [unreadNotifData]);

  // Conversations (for unread msg badge only)
  const { data: convData } = useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: () => api.getConversations(),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (convData) {
      const ids = new Set((convData.conversations || []).filter(c => (c.unreadCount || 0) > 0).map(c => c.id));
      unreadConvIdsRef.current = ids;
      setUnreadMsgCount(ids.size);
    }
  }, [convData]);

  useEffect(() => {
    if (pathname.startsWith('/messages')) {
      unreadConvIdsRef.current.clear();
      setUnreadMsgCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!socket) return;
    return socket.on('new_message', ({ conversationId, message }) => {
      if (message?.senderId === user?.id) return;
      if (pathname.startsWith('/messages')) return;
      if (!unreadConvIdsRef.current.has(conversationId)) {
        unreadConvIdsRef.current.add(conversationId);
        setUnreadMsgCount(unreadConvIdsRef.current.size);
      }
    });
  }, [socket, user?.id, pathname]);

  // Feed data
  const { data: feedRaw, isLoading: feedQueryLoading, isError: feedQueryError } = useQuery({
    queryKey: QUERY_KEYS.feed,
    queryFn: () => api.getFeed(),
    staleTime: 30_000,
  });
  const { data: stashedIdsRaw = [] } = useQuery({
    queryKey: QUERY_KEYS.stashedIds,
    queryFn: () => api.getStashedIds(),
    staleTime: 30_000,
  });

  // Seed feedData + stashedIds from query results
  useEffect(() => {
    if (!feedQueryLoading && feedRaw) {
      const ids = stashedIdsRaw || [];
      setStashedIds(ids);
      setFeedData({
        following: (feedRaw.following || []).map(d => mapDecisionToCommit(d, ids)),
        trending:  (feedRaw.trending  || []).map(d => mapDecisionToCommit(d, ids)),
        hasFollowing: feedRaw.hasFollowing,
      });
      setFeedLoading(false);
      setFeedSeeded(true);
    } else if (!feedQueryLoading && feedQueryError) {
      setFeedLoading(false);
    }
  }, [feedRaw, stashedIdsRaw, feedQueryLoading, feedQueryError]);

  // Following (sidebar)
  const { data: followingData = [] } = useQuery({
    queryKey: QUERY_KEYS.following(user?.id),
    queryFn: () => api.getFollowing(),
    enabled: !!user,
    staleTime: 60_000,
  });
  useEffect(() => { setSidebarFollowing(followingData); }, [followingData]);

  useEffect(() => {
    const h = e => {
      if (e.data?.type === '__activate_edit_mode')   setTweaksVis(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksVis(false);
    };
    window.addEventListener('message', h);
    window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', h);
  }, []);

  const react = (id, type) => {
    const prevFeedData = feedData;
    const toggle = list => list.map(c => {
      if (c.id !== id) return c;
      const wasActive = c.ur[type];
      return {
        ...c,
        ur: { ...c.ur, [type]: !wasActive },
        rx: { ...c.rx, [type]: c.rx[type] + (wasActive ? -1 : 1) },
      };
    });
    setFeedData(prev => ({ ...prev, following: toggle(prev.following), trending: toggle(prev.trending) }));
    api.reactToDecision(id, type).then(result => {
      setFeedData(prev => ({
        ...prev,
        following: prev.following.map(c => c.id !== id ? c : { ...c, rx: { ...c.rx, [type]: result.count }, ur: { ...c.ur, [type]: result.reacted } }),
        trending:  prev.trending.map(c =>  c.id !== id ? c : { ...c, rx: { ...c.rx, [type]: result.count }, ur: { ...c.ur, [type]: result.reacted } }),
      }));
    }).catch(() => {
      setFeedData(prevFeedData);
    });
  };

  const stash = (id) => {
    const wasStashed = stashedIds.includes(id);
    setStashedIds(prev => wasStashed ? prev.filter(x => x !== id) : [...prev, id]);
    setFeedData(prev => ({
      ...prev,
      following: prev.following.map(c => c.id === id ? { ...c, stashed: !wasStashed } : c),
      trending:  prev.trending.map(c => c.id === id ? { ...c, stashed: !wasStashed } : c),
    }));
    api.toggleStash(id).catch(() => {
      setStashedIds(prev => wasStashed ? [...prev, id] : prev.filter(x => x !== id));
      setFeedData(prev => ({
        ...prev,
        following: prev.following.map(c => c.id === id ? { ...c, stashed: wasStashed } : c),
        trending:  prev.trending.map(c => c.id === id ? { ...c, stashed: wasStashed } : c),
      }));
    });
  };

  const deletePost = async (id) => {
    try {
      await api.deleteDecision(id);
      setFeedData(prev => ({
        ...prev,
        following: prev.following.filter(c => c.id !== id),
        trending: prev.trending.filter(c => c.id !== id),
      }));
      addToast({ message: 'Post deleted', type: 'success' });
    } catch {
      addToast({ message: 'Failed to delete post', type: 'error' });
    }
  };

  const addCommit = async data => {
    try {
      const saved = await api.createDecision({
        decision: data.message,
        branch_name: data.branch,
        type: data.category,
        body: data.body || undefined,
        visibility: data.visibility || 'public',
        image: data.image || undefined,
      });
      if (data.isNewBranch) {
        api.createBranch({ name: data.branch, type: 'what-if' }).catch(() => {});
      }
      const newPost = mapDecisionToCommit(saved);
      setFeedData(prev => ({ ...prev, following: [newPost, ...prev.following] }));
      // Invalidate so profile/decisions queries re-fetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decisions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches });
    } catch {
      const newPost = { id: `c_${Date.now()}`, userId: user?.id, branch: data.branch, message: data.message, body: data.body, category: data.category, ts: 'just now', rx: { fork: 0, merge: 0, support: 0 }, ur: {}, wi: data.wi };
      setFeedData(prev => ({ ...prev, following: [newPost, ...prev.following] }));
    }
  };

  const compact = tweaks.density === 'compact';

  /* ── Bell icon (shared) ── */
  const bellIcon = (
    <div style={{ position: 'relative' }}>
      <div ref={bellRef} onClick={() => setNotifOpen(p => !p)}
        style={{ width: 32, height: 32, borderRadius: 8, background: notifOpen ? 'oklch(93% 0.05 260)' : 'oklch(96% 0.008 80)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: notifOpen ? 'oklch(42% 0.2 260)' : 'oklch(48% 0.01 260)', transition: 'all 0.12s' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2a4.5 4.5 0 0 1 4.5 4.5c0 2.5.8 3.5 1.5 4H2c.7-.5 1.5-1.5 1.5-4A4.5 4.5 0 0 1 8 2z" /><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" /></svg>
      </div>
      {unreadNotifCount > 0 && !notifOpen && (
        <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700, color: 'white', border: '2px solid white', pointerEvents: 'none' }}>{unreadNotifCount}</div>
      )}
      {notifOpen && <NotifDropdown onClose={() => setNotifOpen(false)} triggerRef={bellRef} onNotifsLoaded={setUnreadNotifCount} onProfile={openProfile} isMobile={isMobile} />}
    </div>
  );

  /* ── Settings save handler ── */
  const handleSettingsSave = async () => {
    if (!settingsSaveRef.current || settingsSaving) return;
    setSettingsSaving(true);
    await settingsSaveRef.current();
    setSettingsSaving(false);
    setSettingsHasChanges(false);
  };

  /* ── Settings save button (used in both top bars) ── */
  const settingsSaveBtn = (
    <button
      onClick={handleSettingsSave}
      disabled={!settingsHasChanges || settingsSaving}
      style={{
        padding: '6px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        border: settingsHasChanges ? '1px solid oklch(52% 0.2 260)' : '1px solid oklch(88% 0.008 260)',
        background: settingsHasChanges ? 'oklch(52% 0.2 260)' : 'oklch(96% 0.008 80)',
        color: settingsHasChanges ? 'white' : 'oklch(65% 0.01 260)',
        cursor: settingsHasChanges && !settingsSaving ? 'pointer' : 'default',
        transition: 'all 0.15s',
        opacity: settingsSaving ? 0.7 : 1,
      }}
    >
      {settingsSaving ? 'Saving…' : 'Save'}
    </button>
  );

  /* ── Desktop top-bar icons (search + bell, or save on settings) ── */
  const topBarIcons = activeNav === 'settings' ? settingsSaveBtn : (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'oklch(96% 0.008 80)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'oklch(48% 0.01 260)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="13.5" y2="13.5" /></svg>
      </div>
      {bellIcon}
    </div>
  );

  /* ── Mobile top-bar icons (settings + bell, or save on settings) ── */
  const mobileTopBarIcons = activeNav === 'settings' ? settingsSaveBtn : (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div onClick={() => navigate('/settings')}
        style={{ width: 32, height: 32, borderRadius: 8, background: 'oklch(96% 0.008 80)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'oklch(48% 0.01 260)', transition: 'all 0.12s' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="12" x2="14" y2="12" />
          <circle cx="5" cy="4" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
      {bellIcon}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'oklch(98.5% 0.005 80)', flexDirection: isMobile ? 'column' : 'row' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="desktop-only" style={{ width: sidebarWidth, flexShrink: 0, background: 'white', borderRight: '1px solid oklch(91% 0.006 80)', display: 'flex', flexDirection: 'column', padding: `18px ${sidebarWidth >= 260 ? '18px' : '14px'}` }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 20px', fontSize: 17, fontWeight: 700 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="oklch(52% 0.2 260)" />
            <line x1="10" y1="6" x2="10" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M10 11 C10 11 10 8 18 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="10" cy="19" r="2.5" fill="white" />
            <circle cx="10" cy="11" r="2.5" fill="white" />
            <circle cx="18" cy="8" r="2.5" fill="white" opacity="0.7" />
          </svg>
          GitLife
        </div>

        {/* Nav */}
        {NAV.map(item => {
          const isActive = activeNav === item.id;
          return (
            <button key={item.id} onClick={() => navigate(`/${item.id === 'feed' ? 'feed' : item.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13.5, fontWeight: isActive ? 600 : 500, color: isActive ? 'oklch(42% 0.2 260)' : 'oklch(48% 0.01 260)', background: isActive ? 'oklch(94% 0.015 260)' : 'transparent', border: 'none', cursor: 'pointer', marginBottom: 1, transition: 'all 0.12s', textAlign: 'left' }}>
              <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{NAV_ICONS[item.id](isActive)}</span>
              {item.label}
              {item.id === 'messages' && unreadMsgCount > 0 && (
                <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: 'oklch(52% 0.2 260)', color: 'white', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Following */}
        {sidebarFollowing.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'oklch(60% 0.01 260)', padding: '0 10px', marginBottom: 7 }}>Following</div>
            {sidebarFollowing.slice(0, 5).map(u => (
              <button key={u.id} onClick={() => openProfile(u.username)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'oklch(96% 0.008 80)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.username} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {(u.username || '?').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'oklch(28% 0.01 260)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.fullName || u.username}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* User profile at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid oklch(91% 0.006 80)' }}>
          <button onClick={() => navigate('/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', transition: 'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'oklch(96% 0.008 80)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {(user?.username || user?.email?.split('@')[0] || '?').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username || user?.email?.split('@')[0] || 'You'}</div>
              <div style={{ fontSize: 11, color: 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
            </div>
          </button>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', fontSize: 12.5, color: 'oklch(55% 0.01 260)', transition: 'all 0.12s', marginTop: 2 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'oklch(95% 0.02 20)'; e.currentTarget.style.color = 'oklch(42% 0.18 20)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(55% 0.01 260)'; }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5" />
              <polyline points="9 10 13 7 9 4" />
              <line x1="13" y1="7" x2="5" y2="7" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, paddingBottom: isMobile ? 'calc(60px + env(safe-area-inset-bottom, 0px))' : 0 }}>

        {/* Desktop top bar */}
        <div className="desktop-only" style={{ height: 52, flexShrink: 0, background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(22px, 2.5vw, 40px)' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{VIEW_TITLE[activeNav] || 'Feed'}</div>
          {topBarIcons}
        </div>

        {/* Mobile top bar */}
        <div className="mobile-only" style={{ height: 52, flexShrink: 0, background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          {/* Logo + brand name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: 'oklch(18% 0.015 260)' }}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="oklch(52% 0.2 260)" />
              <line x1="10" y1="6" x2="10" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              <path d="M10 11 C10 11 10 8 18 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              <circle cx="10" cy="19" r="2.5" fill="white" />
              <circle cx="10" cy="11" r="2.5" fill="white" />
              <circle cx="18" cy="8" r="2.5" fill="white" opacity="0.7" />
            </svg>
            GitLife
          </div>
          {mobileTopBarIcons}
        </div>

        {/* View content — extra bottom padding on mobile for the bottom nav */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedView feedData={feedData} onReact={react} onStash={stash} onDelete={deletePost} onNew={() => setModal(true)} compact={compact} loading={feedLoading} currentUser={user} openMessage={openMessage} onProfile={openProfile} hideFab={isMobile} />} />
            <Route path="/explore" element={<ExploreView onMessage={openMessage} onProfile={openProfile} currentUser={user} stashedIds={stashedIds} onStashChange={(id, stashed) => setStashedIds(prev => stashed ? [...prev, id] : prev.filter(x => x !== id))} />} />
            <Route path="/profile" element={<ProfileView viz={tweaks.timelineViz} username={null} onProfile={openProfile} onMessage={openMessage} currentUser={user} stashedIds={stashedIds} onStashChange={(id, stashed) => setStashedIds(prev => stashed ? [...prev, id] : prev.filter(x => x !== id))} />} />
            <Route path="/messages" element={<MessagesView onProfile={openProfile} isMobile={isMobile} />} />
            <Route path="/settings" element={<SettingsView saveRef={settingsSaveRef} onHasChanges={setSettingsHasChanges} />} />
            <Route path="/:username" element={<ProfileViewRoute viz={tweaks.timelineViz} onProfile={openProfile} onMessage={openMessage} currentUser={user} stashedIds={stashedIds} onStashChange={(id, stashed) => setStashedIds(prev => stashed ? [...prev, id] : prev.filter(x => x !== id))} />} />
          </Routes>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      {isMobile && (
        <BottomNav
          activeNav={activeNav}
          navigate={navigate}
          setModal={setModal}
          unreadMsgCount={unreadMsgCount}
          user={user}
        />
      )}

      {modal && <NewCommitModal onClose={() => setModal(false)} onSubmit={addCommit} />}
      <TweaksPanel visible={tweaksVis} tweaks={tweaks} setTweaks={setTweaks} />
    </div>
  );
}
