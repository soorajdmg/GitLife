import { useState } from 'react';
import { CATEGORIES } from '../data/gitlife';
import CommitCard from '../components/ui/CommitCard';

export default function FeedView({ commits, onReact, onNew, compact }) {
  const [filter, setFilter] = useState('All');
  const shown = filter === 'All' ? commits : commits.filter(c => c.category === filter);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'white', borderBottom: '1px solid oklch(91% 0.006 80)', padding: '12px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, border: `1px solid ${filter === f ? 'oklch(52% 0.2 260)' : 'oklch(88% 0.008 260)'}`, background: filter === f ? 'oklch(52% 0.2 260)' : 'white', color: filter === f ? 'white' : 'oklch(48% 0.01 260)', transition: 'all 0.12s', cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 0 80px' }}>
          {shown.map(c => <CommitCard key={c.id} c={c} onReact={onReact} compact={compact} />)}
          {shown.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: 'oklch(58% 0.01 260)', fontSize: 14 }}>Nothing here yet.</div>}
        </div>
      </div>
      <button onClick={onNew}
        style={{ position: 'fixed', bottom: 28, right: 28, background: 'oklch(52% 0.2 260)', color: 'white', border: 'none', borderRadius: 13, padding: '12px 22px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px oklch(52% 0.2 260 / 0.35)', transition: 'all 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 26px oklch(52% 0.2 260 / 0.42)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px oklch(52% 0.2 260 / 0.35)'; }}>
        + New commit
      </button>
    </div>
  );
}
