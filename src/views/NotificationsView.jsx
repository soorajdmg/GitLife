import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../config/api';
import { QUERY_KEYS } from '../config/queryClient';

function formatRelativeTime(ts) {
  if (!ts) return 'just now';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avatarColor(str = '') {
  const colors = ['oklch(52% 0.18 260)', 'oklch(52% 0.18 155)', 'oklch(52% 0.18 55)', 'oklch(52% 0.18 330)', 'oklch(52% 0.18 30)'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const TYPE_ICON = { fork: '⎇', merge: '↩', support: '♡', follow: '👤', comment: '💬', reply: '↪' };
const TYPE_BG   = { fork: 'oklch(93% 0.06 60)', merge: 'oklch(93% 0.05 260)', support: 'oklch(93% 0.05 155)', follow: 'oklch(93% 0.05 330)', comment: 'oklch(93% 0.05 60)', reply: 'oklch(93% 0.05 260)' };
const TYPE_FG   = { fork: 'oklch(45% 0.19 55)', merge: 'oklch(42% 0.2 260)',  support: 'oklch(40% 0.18 155)', follow: 'oklch(42% 0.18 330)', comment: 'oklch(45% 0.19 55)', reply: 'oklch(42% 0.2 260)' };

function notifMessage(n) {
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

const PAGE_SIZE = 10;

export default function NotificationsView() {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const { data: notifs = [], isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => api.getNotifications(50),
    staleTime: 60_000,
  });

  const unreadCount = notifs.filter(n => !n.read).length;
  const shown = notifs.slice(0, visible);

  const markAllRead = async () => {
    queryClient.setQueryData(QUERY_KEYS.notifications, (old = []) =>
      old.map(n => ({ ...n, read: true }))
    );
    await api.markAllNotifsRead().catch(() => {});
  };

  const markOneRead = async (id) => {
    queryClient.setQueryData(QUERY_KEYS.notifications, (old = []) =>
      old.map(n => n.id === id ? { ...n, read: true } : n)
    );
    await api.markNotifRead(id).catch(() => {});
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: 'oklch(62% 0.01 260)' }}>Loading notifications…</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 'var(--feed-max-width, 680px)', margin: '0 auto', padding: '24px 16px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 2px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(45% 0.01 260)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12.5, fontWeight: 500, color: 'oklch(42% 0.2 260)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Mark all read</button>
          )}
        </div>

        {notifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'oklch(62% 0.01 260)', fontSize: 13 }}>No notifications yet</div>
        )}

        {shown.map(n => {
          const senderName = n.sender?.fullName || n.sender?.username || '?';
          const color = avatarColor(n.senderId);
          const ini = initials(senderName);
          return (
            <div key={n.id} onClick={() => markOneRead(n.id)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: !n.read ? 'oklch(96.5% 0.012 260)' : 'white', border: `1px solid ${!n.read ? 'oklch(89% 0.04 260)' : 'oklch(92% 0.006 80)'}`, borderRadius: 13, marginBottom: 8, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = !n.read ? 'oklch(95% 0.018 260)' : 'oklch(98.5% 0.005 80)'}
              onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'oklch(96.5% 0.012 260)' : 'white'}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {n.sender?.avatarUrl
                  ? <img src={n.sender.avatarUrl} alt={senderName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{ini}</div>
                }
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: TYPE_BG[n.type] || 'oklch(93% 0.05 260)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: TYPE_FG[n.type] || 'oklch(42% 0.2 260)' }}>{TYPE_ICON[n.type] || '●'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.45, marginBottom: (n.decisionText || n.commentText) ? 5 : 0 }}>
                  <span style={{ color: 'oklch(44% 0.01 260)' }}>{notifMessage(n)}</span>
                </div>
                {n.commentText && (
                  <div style={{ fontSize: 12, color: 'oklch(48% 0.01 260)', background: 'oklch(96% 0.006 80)', borderRadius: 7, padding: '4px 9px', display: 'inline-block', marginBottom: 4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{n.commentText}"
                  </div>
                )}
                {!n.commentText && n.decisionText && (
                  <div style={{ fontSize: 12, color: 'oklch(48% 0.01 260)', background: 'oklch(96% 0.006 80)', borderRadius: 7, padding: '4px 9px', display: 'inline-block', marginBottom: 4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{n.decisionText}"
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'oklch(62% 0.01 260)', marginTop: 3 }}>{formatRelativeTime(n.createdAt)}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(52% 0.2 260)', flexShrink: 0, marginTop: 4 }} />}
            </div>
          );
        })}

        {visible < notifs.length && (
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            style={{ display: 'block', width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500, color: 'oklch(42% 0.2 260)', background: 'none', border: '1px solid oklch(90% 0.006 260)', borderRadius: 10, cursor: 'pointer', marginTop: 4 }}
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
