import { useState } from 'react';
import { ALL_USERS, TRENDING, WHATIFS, SUGGESTED_PEOPLE, CATEGORIES, fmt } from '../data/gitlife';
import BranchPill from '../components/ui/BranchPill';
import Tag from '../components/ui/Tag';
import { catColor } from '../data/gitlife';

function ExploreCard({ c, rank }) {
  const user = ALL_USERS[c.userId];
  const [reacted, setReacted] = useState({});
  if (!user) return null;
  const rankBg = ['oklch(72% 0.18 60)', 'oklch(78% 0.06 260)', 'oklch(68% 0.12 30)'][rank - 1];
  return (
    <div style={{ background: c.wi ? 'oklch(99.5% 0.012 65)' : 'white', border: `1px solid ${c.wi ? 'oklch(88% 0.1 60)' : 'oklch(91% 0.006 80)'}`, borderRadius: 14, padding: '16px 18px', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
      {rank && rank <= 3 && <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 6, background: rankBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: 'white' }}>#{rank}</div>}
      {c.wi && <div style={{ fontSize: 11.5, color: 'oklch(48% 0.19 55)', fontWeight: 500, marginBottom: 7 }}>⎇ what-if</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: 'white', flexShrink: 0 }}>{user.ini}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
          <span style={{ fontSize: 12, color: 'oklch(58% 0.01 260)', marginLeft: 6 }}>{c.ts}</span>
        </div>
        <BranchPill name={c.branch} wi={c.wi} merged={false} />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, marginBottom: c.body ? 7 : 10, color: c.wi ? 'oklch(42% 0.18 55)' : 'oklch(15% 0.015 260)' }}>{c.message}</div>
      {c.body && <div style={{ fontSize: 13, color: 'oklch(44% 0.01 260)', lineHeight: 1.6, marginBottom: 10 }}>{c.body}</div>}
      <div style={{ marginBottom: 10 }}><Tag cat={c.category} /></div>
      <div style={{ display: 'flex', gap: 5, paddingTop: 10, borderTop: '1px solid oklch(96% 0.004 80)' }}>
        {[['⎇', 'fork', c.rx.fork], ['↩', 'merge', c.rx.merge], ['♡', 'support', c.rx.support]].map(([icon, type, base]) => (
          <button key={type} onClick={() => setReacted(p => ({ ...p, [type]: !p[type] }))}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 7, fontSize: 12, fontWeight: 500, border: `1px solid ${reacted[type] ? 'oklch(52% 0.2 260)' : 'oklch(90% 0.006 260)'}`, background: reacted[type] ? 'oklch(95% 0.015 260)' : 'white', color: reacted[type] ? 'oklch(42% 0.2 260)' : 'oklch(50% 0.01 260)', cursor: 'pointer', transition: 'all 0.12s' }}>
            {icon} {fmt(base + (reacted[type] ? 1 : 0))}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'oklch(68% 0.006 260)', display: 'flex', alignItems: 'center' }}>{fmt(c.rx.fork + c.rx.merge + c.rx.support)} reactions</span>
      </div>
    </div>
  );
}

export default function ExploreView() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('trending');
  const [catFilter, setCatFilter] = useState('All');
  const [followed, setFollowed] = useState(() => new Set(['jordan', 'taylor']));
  const base = tab === 'trending' ? TRENDING : WHATIFS;
  const shownCommits = base.filter(c => {
    const u = ALL_USERS[c.userId];
    return (catFilter === 'All' || c.category === catFilter) && (!search || c.message.toLowerCase().includes(search.toLowerCase()) || (u?.name || '').toLowerCase().includes(search.toLowerCase()));
  });
  const peopleResults = search ? Object.values(ALL_USERS).filter(u => u.id !== 'alex' && (u.name.toLowerCase().includes(search.toLowerCase()) || u.handle.toLowerCase().includes(search.toLowerCase()))) : [];
  const toggleFollow = id => setFollowed(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', padding: '12px 22px', flexShrink: 0 }}>
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'oklch(62% 0.01 260)', pointerEvents: 'none' }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search decisions, people, branches..."
            style={{ width: '100%', padding: '9px 36px 9px 36px', borderRadius: 10, border: '1px solid oklch(88% 0.008 260)', fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', background: 'oklch(98.5% 0.005 80)', color: 'oklch(18% 0.015 260)', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 17, color: 'oklch(60% 0.01 260)', lineHeight: 1, padding: 0 }}>×</button>}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '18px 0 60px' }}>
          {!search && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 12, padding: '0 2px' }}>Suggested people</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                {SUGGESTED_PEOPLE.map(u => (
                  <div key={u.id}
                    style={{ flexShrink: 0, width: 130, background: 'white', border: '1px solid oklch(91% 0.006 80)', borderRadius: 14, padding: '18px 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 4px oklch(70% 0.01 260 / 0.06)', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 14px oklch(70% 0.01 260 / 0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px oklch(70% 0.01 260 / 0.06)'}>
                    <div style={{ width: 54, height: 54, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 10, position: 'relative' }}>
                      {u.ini}
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: 'oklch(58% 0.18 155)', border: '2px solid white' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 2, lineHeight: 1.2 }}>{u.name.split(' ')[0]} {u.name.split(' ')[1]?.[0]}.</div>
                    <div style={{ fontSize: 11, color: 'oklch(58% 0.01 260)', textAlign: 'center', marginBottom: 12 }}>{fmt(u.followers)} followers</div>
                    <button onClick={() => toggleFollow(u.id)}
                      style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: `1px solid ${followed.has(u.id) ? 'oklch(88% 0.008 260)' : 'oklch(52% 0.2 260)'}`, background: followed.has(u.id) ? 'white' : 'oklch(52% 0.2 260)', color: followed.has(u.id) ? 'oklch(44% 0.01 260)' : 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.14s' }}>
                      {followed.has(u.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {peopleResults.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 11, padding: '0 2px' }}>People</div>
              {peopleResults.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 12, border: '1px solid oklch(91% 0.006 80)', marginBottom: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>{u.ini}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 11.5, color: 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace" }}>{u.handle}</div>
                    <div style={{ fontSize: 12, color: 'oklch(50% 0.01 260)', marginTop: 2 }}>{u.bio}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(u.commits)}</div>
                    <div style={{ fontSize: 11, color: 'oklch(58% 0.01 260)' }}>commits</div>
                  </div>
                </div>
              ))}
              {shownCommits.length > 0 && <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 11, marginTop: 22, padding: '0 2px' }}>Decisions</div>}
            </div>
          )}

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

          {shownCommits.map((c, i) => <ExploreCard key={c.id} c={c} rank={!search && tab === 'trending' ? i + 1 : null} />)}
          {shownCommits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(58% 0.01 260)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⌕</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>No results found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
