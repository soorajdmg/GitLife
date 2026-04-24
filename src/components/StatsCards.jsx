import { useState, useEffect, useRef } from 'react';
import { GitBranch, Wrench, Trophy, GitCommitHorizontal, Zap } from 'lucide-react';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import SkeletonCard from './shared/SkeletonCard';
import './StatsCards.css';

function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * ease));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

function computeStreak(decisions) {
  const days = new Set(decisions.map(d => new Date(d.timestamp || d.createdAt).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function StatCard({ icon: Icon, label, value, color, suffix = '' }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div className="stats-card" style={{ borderLeftColor: color }}>
      <div className="stats-header">
        <Icon size={20} style={{ color }} />
        <span className="stats-label">{label}</span>
      </div>
      <div className="stats-value">
        {typeof value === 'number' ? animated : value}{suffix}
      </div>
    </div>
  );
}

export default function StatsCards() {
  const { refreshTrigger } = useDataRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let first = true;
    const fetchStats = async () => {
      try {
        const [stats, decisions, branches] = await Promise.all([
          api.getStats(),
          api.getDecisions({ limit: 500, sortBy: 'timestamp', sortOrder: 'desc' }),
          api.getBranches()
        ]);
        const fixes = decisions.filter(d => d.type === 'fix').length;
        const streak = computeStreak(decisions);
        setData({
          decisions: decisions.length,
          fixes,
          branches: branches.length,
          impact: stats?.impacts || 0,
          streak,
        });
      } catch {
        // silently fail — keep previous data
      } finally {
        if (first) { setLoading(false); first = false; }
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="stats-container">
        {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} height="90px" lines={2} />)}
      </div>
    );
  }

  return (
    <div className="stats-container">
      <StatCard icon={GitCommitHorizontal} label="Decisions Made"    value={data.decisions} color="var(--accent-yellow)" />
      <StatCard icon={Wrench}             label="Course Corrections" value={data.fixes}     color="var(--accent-red)" />
      <StatCard icon={GitBranch}          label="Branches Created"   value={data.branches}  color="var(--accent-blue)" />
      <StatCard icon={Trophy}             label="Impact Score"       value={data.impact}    color="var(--accent-purple)" />
      <StatCard icon={Zap}                label="Day Streak"         value={data.streak}    color="var(--accent-green)" suffix={data.streak === 1 ? ' day' : ' days'} />
    </div>
  );
}
