import { useState } from 'react';
import { USERS, fmt } from '../../data/gitlife';
import Avatar from './Avatar';
import BranchPill from './BranchPill';
import Tag from './Tag';

export default function CommitCard({ c, onReact, compact, currentUser }) {
  const mockUser = USERS[c.userId] || USERS.alex;
  const user = currentUser
    ? {
        name: currentUser.fullName || currentUser.username || mockUser.name,
        handle: `@${currentUser.username || mockUser.handle}`,
        ini: (currentUser.fullName || currentUser.username || 'U').slice(0, 2).toUpperCase(),
        color: mockUser.color,
        avatarUrl: currentUser.avatarUrl,
      }
    : mockUser;
  const [open, setOpen] = useState(false);

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

  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        background: c.wi ? 'oklch(99.5% 0.012 65)' : 'white',
        border: `1px solid ${c.wi ? 'oklch(88% 0.1 60)' : 'oklch(91% 0.006 80)'}`,
        borderRadius: 14, padding: compact ? '14px 16px' : '18px 20px',
        marginBottom: 10, cursor: 'pointer', transition: 'box-shadow 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 16px oklch(70% 0.01 260 / 0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {c.wi && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'oklch(48% 0.19 55)', fontWeight: 500, marginBottom: 8 }}>⎇ what-if branch</div>}
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
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: c.body ? 6 : 10, color: c.wi ? 'oklch(42% 0.18 55)' : 'oklch(15% 0.015 260)' }}>
        {c.message}
      </div>
      {c.body && (open || c.body.length < 90) && (
        <div style={{ fontSize: 13.5, color: 'oklch(44% 0.01 260)', lineHeight: 1.65, marginBottom: 10 }}>{c.body}</div>
      )}
      {c.body && c.body.length >= 90 && !open && (
        <div style={{ fontSize: 12, color: 'oklch(52% 0.2 260)', marginBottom: 8, marginTop: -2 }}>Read more</div>
      )}
      {c.img && (
        <div style={{ margin: '10px 0', borderRadius: 10, overflow: 'hidden', maxHeight: 220 }}>
          <img src={c.img} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 }} onError={e => e.target.style.display = 'none'} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Tag cat={c.category} />
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid oklch(95% 0.004 80)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {[['⎇', 'fork'], ['↩', 'merge'], ['♡', 'support']].map(([icon, type]) => {
            const active = c.ur[type];
            return (
              <button key={type} onClick={() => onReact(c.id, type)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, transition: 'all 0.12s', ...rxStyle(type, active) }}>
                {icon} {fmt(c.rx[type] + (active ? 1 : 0))}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 11, color: 'oklch(68% 0.006 260)' }}>{fmt(c.rx.fork + c.rx.merge + c.rx.support)} reactions</span>
      </div>
    </div>
  );
}
