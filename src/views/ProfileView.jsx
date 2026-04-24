import { useState, useEffect } from 'react';
import { DAY_LABELS, CELL_COLORS } from '../data/gitlife';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import BranchPill from '../components/ui/BranchPill';
import Tag from '../components/ui/Tag';

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

function ActivityGraph({ commitCount, topCategory, commits }) {
  const [hovered, setHovered] = useState(null);
  const CELL = 10, GAP = 2;

  const { weekData, weekMonths, graphStart } = buildActivityData(commits);

  const getDate = (week, day) => {
    const d = new Date(graphStart);
    d.setDate(d.getDate() + week * 7 + day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const monthLabels = [];
  weekMonths.forEach((m, i) => {
    if (i === 0 || m !== weekMonths[i - 1]) monthLabels.push({ week: i, label: m });
  });

  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(58% 0.01 260)', marginBottom: 10 }}>Commit activity</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[[String(commitCount), 'commits'], ['—', 'streak'], [topCategory || '—', 'top area']].map(([val, lbl]) => (
          <div key={lbl} style={{ flex: 1, padding: '7px 8px', background: 'oklch(97% 0.006 260)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(25% 0.015 260)' }}>{val}</div>
            <div style={{ fontSize: 10, color: 'oklch(58% 0.01 260)', marginTop: 1 }}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ marginLeft: 18, marginBottom: 3, position: 'relative', height: 14 }}>
          {monthLabels.map(({ week, label }) => (
            <div key={week} style={{ position: 'absolute', left: week * (CELL + GAP), fontSize: 9.5, fontWeight: 600, color: 'oklch(58% 0.01 260)', whiteSpace: 'nowrap' }}>{label}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 4, flexShrink: 0 }}>
            {DAY_LABELS.map((d, i) => <div key={i} style={{ height: CELL, fontSize: 9, color: 'oklch(62% 0.01 260)', lineHeight: `${CELL}px`, textAlign: 'right', width: 14 }}>{d}</div>)}
          </div>
          <div style={{ display: 'flex', gap: GAP }}>
            {weekData.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {week.map((count, di) => {
                  const isHov = hovered?.week === wi && hovered?.day === di;
                  return (
                    <div key={di}
                      onMouseEnter={() => setHovered({ week: wi, day: di, count, date: getDate(wi, di) })}
                      onMouseLeave={() => setHovered(null)}
                      style={{ width: CELL, height: CELL, borderRadius: 2, background: CELL_COLORS[count], transition: 'transform 0.1s', transform: isHov ? 'scale(1.4)' : 'scale(1)', cursor: 'default', position: 'relative', zIndex: isHov ? 2 : 1 }} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {hovered && (
          <div style={{ position: 'absolute', bottom: -42, left: 18, background: 'oklch(18% 0.015 260)', color: 'white', padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10, lineHeight: 1.6 }}>
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
function GitGraph({ commits }) {
  const branchNames = [...new Set(commits.map(c => c.branch))];
  const COL = Object.fromEntries(branchNames.map((b, i) => [b, b === 'main' ? 0 : i]));
  const COLORS = BRANCH_COLORS;
  const CW = 22, RH = 70;
  const svgW = CW * Math.max(branchNames.length, 1) + 4;

  return (
    <div>
      {commits.map((c, i) => {
        const col = COL[c.branch] ?? 1;
        const color = c.wi ? COLORS[col % COLORS.length] : COLORS[0];
        const mainX = CW / 2, cx = col * CW + CW / 2, midY = RH / 2;
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'stretch' }}>
            <svg width={svgW} height={RH} style={{ flexShrink: 0, display: 'block' }}>
              <line x1={mainX} y1={0} x2={mainX} y2={RH} stroke="oklch(52% 0.2 260)" strokeWidth={2} />
              {col > 0 && <line x1={cx} y1={0} x2={cx} y2={RH} stroke={COLORS[col % COLORS.length]} strokeWidth={1.5} strokeDasharray="5 3" />}
              {col > 0 && i > 0 && (COL[commits[i - 1]?.branch] === 0) && <path d={`M ${mainX} 0 C ${mainX} ${midY * 0.6} ${cx} ${midY * 0.4} ${cx} ${midY}`} fill="none" stroke={COLORS[col % COLORS.length]} strokeWidth={1.5} strokeDasharray="5 3" />}
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
function CommitLog({ commits }) {
  return (
    <div>
      {commits.map((c, i) => {
        const color = c.wi ? 'oklch(60% 0.19 55)' : 'oklch(52% 0.2 260)';
        return (
          <div key={c.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < commits.length - 1 ? '1px solid oklch(96% 0.004 80)' : 'none' }}>
            <div style={{ width: 3, borderRadius: 2, background: color, flexShrink: 0, alignSelf: 'stretch', opacity: c.wi ? 0.6 : 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 5 }}>
                <BranchPill name={c.branch === 'main' ? 'main' : c.branch.replace('what-if/', '')} wi={c.wi} merged={false} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 5, color: c.wi ? 'oklch(45% 0.18 55)' : 'oklch(15% 0.015 260)', lineHeight: 1.35 }}>{c.message}</div>
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
export default function ProfileView({ viz }) {
  const { user } = useAuth();
  const [activeBranch, setActiveBranch] = useState('all');
  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDecisions({ sortOrder: 'desc' }),
      api.getBranches(),
    ])
      .then(([decisions, apiBranches]) => {
        setCommits(decisions.map(d => ({
          id: d.id,
          branch: d.branch_name,
          message: d.decision,
          date: formatDate(d.timestamp),
          rawDate: d.timestamp,
          category: d.type || 'Career',
          wi: d.branch_name !== 'main',
          merged: false,
        })));
        setBranches(apiBranches.map((b, i) => ({
          id: b.id,
          name: b.name,
          color: BRANCH_COLORS[i % BRANCH_COLORS.length],
          merged: b.status === 'merged',
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  // Derive display info from real auth user
  const displayName = user?.fullName || user?.username || user?.email?.split('@')[0] || 'You';
  const handle = user?.username ? `@${user.username}` : (user?.email ? `@${user.email.split('@')[0]}` : '@me');
  const initials = displayName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = 'oklch(52% 0.2 260)';

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '28px 28px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 1 }}>{displayName}</div>
            <div style={{ fontSize: 12.5, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 7 }}>{handle}</div>
            <div style={{ display: 'flex', gap: 22 }}>
              {[['commits', commits.length], ['branches', branches.length]].map(([lbl, val]) => (
                <div key={lbl}><span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(val)}</span> <span style={{ fontSize: 12, color: 'oklch(58% 0.01 260)' }}>{lbl}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
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
              <Viz commits={shown} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
