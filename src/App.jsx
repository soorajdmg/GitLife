import { useState, useEffect, useRef } from 'react';
import { NOTIF_DATA, ALL_USERS } from './data/gitlife';
import { api } from './config/api';
import { useAuth } from './contexts/AuthContext';
import FeedView from './views/FeedView';
import ExploreView from './views/ExploreView';
import ProfileView from './views/ProfileView';
import MessagesView from './views/MessagesView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import NewCommitModal from './components/ui/NewCommitModal';

/* ─── NAV ICONS ─── */
const NAV_ICONS = {
  feed: (a) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="4" r="1.2" fill={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} stroke="none" /><line x1="7.5" y1="4" x2="13" y2="4" />
      <circle cx="4" cy="8" r="1.2" fill={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} stroke="none" /><line x1="7.5" y1="8" x2="13" y2="8" />
      <circle cx="4" cy="12" r="1.2" fill={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} stroke="none" /><line x1="7.5" y1="12" x2="13" y2="12" />
    </svg>
  ),
  explore: (a) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <polygon points="10.5,5.5 6,7 5.5,10.5 10,9" fill={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} stroke="none" />
    </svg>
  ),
  profile: (a) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 13.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" />
    </svg>
  ),
  messages: (a) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={a ? 'oklch(42% 0.2 260)' : 'oklch(55% 0.01 260)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5C2 2.7 2.7 2 3.5 2h9C13.3 2 14 2.7 14 3.5v6c0 .8-.7 1.5-1.5 1.5H9l-3 2.5V11H3.5C2.7 11 2 10.3 2 9.5v-6z" />
      <line x1="5" y1="5.5" x2="11" y2="5.5" /><line x1="5" y1="8" x2="8.5" y2="8" />
    </svg>
  ),
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
  { id: 'feed',          label: 'Feed' },
  { id: 'explore',       label: 'Explore' },
  { id: 'profile',  label: 'My Life' },
  { id: 'messages', label: 'Messages' },
];

const VIEW_TITLE = { feed: 'Feed', explore: 'Explore', profile: 'My Life', messages: 'Messages', branches: 'Branches', settings: 'Settings', notifications: 'Notifications' };

/* ─── NOTIFICATIONS DROPDOWN ─── */
function NotifDropdown({ onClose, triggerRef }) {
  const [notifs, setNotifs] = useState(NOTIF_DATA);
  const ref = useRef();

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target) && !(triggerRef?.current && triggerRef.current.contains(e.target))) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, unread: false })));
  const unreadCount = notifs.filter(n => n.unread).length;

  const typeIcon = type => ({ fork: '⎇', merge: '↩', support: '♡', follow: '👤' }[type] || '●');
  const typeBg   = type => ({ fork: 'oklch(93% 0.06 60)', merge: 'oklch(93% 0.05 260)', support: 'oklch(93% 0.05 155)', follow: 'oklch(93% 0.05 330)' }[type] || 'oklch(93% 0.05 260)');
  const typeFg   = type => ({ fork: 'oklch(45% 0.19 55)', merge: 'oklch(42% 0.2 260)',  support: 'oklch(40% 0.18 155)', follow: 'oklch(42% 0.18 330)' }[type] || 'oklch(42% 0.2 260)');

  return (
    <div ref={ref} style={{ position: 'absolute', top: 44, right: 0, width: 360, background: 'white', borderRadius: 14, boxShadow: '0 8px 40px oklch(25% 0.05 260 / 0.16)', border: '1px solid oklch(91% 0.006 80)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid oklch(94% 0.004 80)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'oklch(18% 0.015 260)' }}>Notifications</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unreadCount > 0 && <span style={{ fontSize: 11.5, color: 'oklch(42% 0.2 260)', fontWeight: 500 }}>{unreadCount} unread</span>}
          {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize: 11.5, fontWeight: 500, color: 'oklch(42% 0.2 260)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Mark all read</button>}
        </div>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {notifs.map(n => {
          const u = ALL_USERS[n.userId];
          return (
            <div key={n.id} onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, unread: false } : x))}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 16px', background: n.unread ? 'oklch(96.5% 0.012 260)' : 'white', borderBottom: '1px solid oklch(95% 0.004 80)', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = n.unread ? 'oklch(95% 0.018 260)' : 'oklch(98.5% 0.005 80)'}
              onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'oklch(96.5% 0.012 260)' : 'white'}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{u.ini}</div>
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: typeBg(n.type), border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: typeFg(n.type) }}>{typeIcon(n.type)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4, marginBottom: n.commit ? 4 : 0 }}>
                  <span style={{ fontWeight: 700 }}>{u.name}</span>
                  <span style={{ color: 'oklch(44% 0.01 260)' }}> {n.message}</span>
                </div>
                {n.commit && (
                  <div style={{ fontSize: 11.5, color: 'oklch(48% 0.01 260)', background: 'oklch(96% 0.006 80)', borderRadius: 6, padding: '3px 8px', display: 'inline-block', marginBottom: 3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{n.commit}"
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: 'oklch(62% 0.01 260)', marginTop: 2 }}>{n.ts}</div>
              </div>
              {n.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(52% 0.2 260)', flexShrink: 0, marginTop: 5 }} />}
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


function mapDecisionToCommit(d) {
  return {
    id: d.id,
    userId: d.userId || 'alex',
    branch: d.branch_name,
    message: d.decision,
    body: d.body || null,
    category: d.type || 'Career',
    ts: formatRelativeTime(d.timestamp),
    rx: { fork: 0, merge: 0, support: 0 },
    ur: {},
    wi: d.branch_name !== 'main',
  };
}

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState(() => localStorage.getItem('gl_view') || 'feed');
  const [messageUserId, setMessageUserId] = useState(null);
  const [viewUserId, setViewUserId] = useState(null);
  const [feedData, setFeedData] = useState({ following: [], trending: [], hasFollowing: false });
  const [feedLoading, setFeedLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [tweaksVis, setTweaksVis] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarFollowing, setSidebarFollowing] = useState([]);
  const bellRef = useRef();

  const openMessage = (userId) => {
    setMessageUserId(userId);
    setView('messages');
  };
  const openProfile = (userId) => {
    setViewUserId(userId || null);
    setView('profile');
  };
  const unreadNotifCount = NOTIF_DATA.filter(n => n.unread).length;

  useEffect(() => {
    api.getFeed()
      .then(data => setFeedData(data))
      .catch(() => setFeedData({ following: [], trending: [], hasFollowing: false }))
      .finally(() => setFeedLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.getFollowing().then(setSidebarFollowing).catch(() => setSidebarFollowing([]));
  }, [user, view]);

  useEffect(() => {
    const h = e => {
      if (e.data?.type === '__activate_edit_mode')   setTweaksVis(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksVis(false);
    };
    window.addEventListener('message', h);
    window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', h);
  }, []);

  useEffect(() => { localStorage.setItem('gl_view', view); }, [view]);

  const react = (id, type) => setFeedData(prev => {
    const toggle = list => list.map(c => c.id !== id ? c : { ...c, ur: { ...c.ur, [type]: !c.ur[type] } });
    return { ...prev, following: toggle(prev.following), trending: toggle(prev.trending) };
  });
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
      const newPost = mapDecisionToCommit(saved);
      setFeedData(prev => ({ ...prev, following: [newPost, ...prev.following] }));
    } catch {
      const newPost = { id: `c_${Date.now()}`, userId: user?.id, branch: data.branch, message: data.message, body: data.body, category: data.category, ts: 'just now', rx: { fork: 0, merge: 0, support: 0 }, ur: {}, wi: data.wi };
      setFeedData(prev => ({ ...prev, following: [newPost, ...prev.following] }));
    }
    setView('feed');
  };
  const compact = tweaks.density === 'compact';

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'oklch(98.5% 0.005 80)' }}>
      {/* Sidebar */}
      <aside style={{ width: 230, flexShrink: 0, background: 'white', borderRight: '1px solid oklch(91% 0.006 80)', display: 'flex', flexDirection: 'column', padding: '18px 14px' }}>
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
        {NAV.map(item => (
          <button key={item.id} onClick={() => { if (item.id === 'profile') setViewUserId(null); setView(item.id); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13.5, fontWeight: view === item.id ? 600 : 500, color: view === item.id ? 'oklch(42% 0.2 260)' : 'oklch(48% 0.01 260)', background: view === item.id ? 'oklch(94% 0.015 260)' : 'transparent', border: 'none', cursor: 'pointer', marginBottom: 1, transition: 'all 0.12s', textAlign: 'left' }}>
            <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{NAV_ICONS[item.id](view === item.id)}</span>
            {item.label}
          </button>
        ))}

        {/* Following */}
        {sidebarFollowing.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'oklch(60% 0.01 260)', padding: '0 10px', marginBottom: 7 }}>Following</div>
            {sidebarFollowing.slice(0, 5).map(u => (
              <button key={u.id} onClick={() => openProfile(u.id)}
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
          <button onClick={() => setView('profile')}
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

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ height: 52, flexShrink: 0, background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{VIEW_TITLE[view] || 'Feed'}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'oklch(96% 0.008 80)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'oklch(48% 0.01 260)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="13.5" y2="13.5" /></svg>
            </div>
            <div style={{ position: 'relative' }}>
              <div ref={bellRef} onClick={() => setNotifOpen(p => !p)}
                style={{ width: 32, height: 32, borderRadius: 8, background: notifOpen ? 'oklch(93% 0.05 260)' : 'oklch(96% 0.008 80)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: notifOpen ? 'oklch(42% 0.2 260)' : 'oklch(48% 0.01 260)', transition: 'all 0.12s' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2a4.5 4.5 0 0 1 4.5 4.5c0 2.5.8 3.5 1.5 4H2c.7-.5 1.5-1.5 1.5-4A4.5 4.5 0 0 1 8 2z" /><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" /></svg>
              </div>
              {unreadNotifCount > 0 && !notifOpen && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700, color: 'white', border: '2px solid white', pointerEvents: 'none' }}>{unreadNotifCount}</div>
              )}
              {notifOpen && <NotifDropdown onClose={() => setNotifOpen(false)} triggerRef={bellRef} />}
            </div>
          </div>
        </div>

        {/* View content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'feed'          && <FeedView feedData={feedData} onReact={react} onNew={() => setModal(true)} compact={compact} loading={feedLoading} currentUser={user} />}
          {view === 'explore'       && <ExploreView onMessage={openMessage} onProfile={openProfile} />}
          {view === 'profile'       && <ProfileView viz={tweaks.timelineViz} userId={viewUserId} onProfile={openProfile} />}
          {view === 'messages' && <MessagesView initialUserId={messageUserId} onProfile={openProfile} />}
          {view === 'settings' && <SettingsView />}
          {view === 'branches'      && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'oklch(60% 0.01 260)' }}>
              <div style={{ fontSize: 36 }}>⎇</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Coming soon</div>
              <div style={{ fontSize: 12.5 }}>This section is in development</div>
            </div>
          )}
        </div>
      </main>

      {modal && <NewCommitModal onClose={() => setModal(false)} onSubmit={addCommit} />}
      <TweaksPanel visible={tweaksVis} tweaks={tweaks} setTweaks={setTweaks} />
    </div>
  );
}
