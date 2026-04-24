import { useState } from 'react';
import { ALL_USERS, NOTIF_DATA } from '../data/gitlife';

export default function NotificationsView() {
  const [notifs, setNotifs] = useState(NOTIF_DATA);
  const unreadCount = notifs.filter(n => n.unread).length;

  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, unread: false })));

  const typeIcon = type => ({ fork: '⎇', merge: '↩', support: '♡', follow: '👤' }[type] || '●');
  const typeBg   = type => ({ fork: 'oklch(93% 0.06 60)', merge: 'oklch(93% 0.05 260)', support: 'oklch(93% 0.05 155)', follow: 'oklch(93% 0.05 330)' }[type] || 'oklch(93% 0.05 260)');
  const typeFg   = type => ({ fork: 'oklch(45% 0.19 55)', merge: 'oklch(42% 0.2 260)',  support: 'oklch(40% 0.18 155)', follow: 'oklch(42% 0.18 330)' }[type] || 'oklch(42% 0.2 260)');

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '24px 0 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 2px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(45% 0.01 260)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12.5, fontWeight: 500, color: 'oklch(42% 0.2 260)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Mark all read</button>
          )}
        </div>

        {notifs.map(n => {
          const u = ALL_USERS[n.userId];
          return (
            <div key={n.id} onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, unread: false } : x))}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: n.unread ? 'oklch(96.5% 0.012 260)' : 'white', border: `1px solid ${n.unread ? 'oklch(89% 0.04 260)' : 'oklch(92% 0.006 80)'}`, borderRadius: 13, marginBottom: 8, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = n.unread ? 'oklch(95% 0.018 260)' : 'oklch(98.5% 0.005 80)'}
              onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'oklch(96.5% 0.012 260)' : 'white'}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{u.ini}</div>
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: typeBg(n.type), border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: typeFg(n.type) }}>{typeIcon(n.type)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.45, marginBottom: n.commit ? 5 : 0 }}>
                  <span style={{ fontWeight: 700 }}>{u.name}</span>
                  <span style={{ color: 'oklch(44% 0.01 260)' }}> {n.message}</span>
                </div>
                {n.commit && (
                  <div style={{ fontSize: 12, color: 'oklch(48% 0.01 260)', background: 'oklch(96% 0.006 80)', borderRadius: 7, padding: '4px 9px', display: 'inline-block', marginBottom: 4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{n.commit}"
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'oklch(62% 0.01 260)', marginTop: 3 }}>{n.ts}</div>
              </div>
              {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(52% 0.2 260)', flexShrink: 0, marginTop: 4 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
