import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, GitCommitHorizontal, GitBranch, Trophy, Zap } from 'lucide-react';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import SkeletonCard from '../components/shared/SkeletonCard';
import './Profile.css';

const MOOD_VALUES = { '🤩': 5, '🥳': 5, '😊': 4, '😐': 3, '🤔': 3, '😴': 2, '😢': 2, '😡': 1, '😰': 1, '🤮': 1 };

function getInitials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#10b981', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171'];
  let hash = 0;
  for (let c of (name || '')) hash = (hash << 5) - hash + c.charCodeAt(0);
  return colors[Math.abs(hash) % colors.length];
}

function computeStreak(decisions) {
  const days = new Set(decisions.map(d => new Date(d.timestamp || d.createdAt).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function buildCalendar(decisions, days = 90) {
  const counts = {};
  decisions.forEach(d => {
    const key = new Date(d.timestamp || d.createdAt).toDateString();
    counts[key] = (counts[key] || 0) + 1;
  });
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    result.push({ date: d, count: counts[d.toDateString()] || 0 });
  }
  return result;
}

function calendarColor(count) {
  if (count === 0) return 'var(--bg-elevated)';
  if (count === 1) return 'rgba(16, 185, 129, 0.35)';
  if (count === 2) return 'rgba(16, 185, 129, 0.6)';
  return 'var(--accent-green)';
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, d, b] = await Promise.all([
          api.getStats(),
          api.getDecisions({ limit: 500 }),
          api.getBranches()
        ]);
        setStats(s);
        setDecisions(d);
        setBranches(b);
      } catch {
        addToast({ message: 'Failed to load profile data', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="profile-page page-content">
        <div className="profile-skeletons">
          <SkeletonCard height="120px" lines={3} />
          <SkeletonCard height="80px" lines={2} />
          <SkeletonCard height="160px" lines={4} />
        </div>
      </div>
    );
  }

  const streak = computeStreak(decisions);
  const calendar = buildCalendar(decisions, 90);

  // Type breakdown
  const typeCounts = { feat: 0, fix: 0, chore: 0 };
  decisions.forEach(d => { if (typeCounts[d.type] !== undefined) typeCounts[d.type]++; });
  const totalTyped = typeCounts.feat + typeCounts.fix + typeCounts.chore || 1;

  // Top branches by decision count
  const branchCounts = {};
  decisions.forEach(d => {
    const n = d.branch_name || 'unknown';
    branchCounts[n] = (branchCounts[n] || 0) + 1;
  });
  const topBranches = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="profile-page page-content">
      {/* Header */}
      <div className="profile-header">
        <div
          className="profile-avatar"
          style={{ background: getAvatarColor(user?.username) }}
        >
          {getInitials(user?.username)}
        </div>
        <div className="profile-identity">
          <h1 className="profile-username">{user?.username}</h1>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-since">Member since {memberSince}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="profile-stats-grid">
        {[
          { icon: GitCommitHorizontal, label: 'Decisions', value: decisions.length, color: '#4ade80' },
          { icon: GitBranch, label: 'Branches', value: branches.length, color: '#60a5fa' },
          { icon: Trophy, label: 'Total Impact', value: stats?.impacts || 0, color: '#a78bfa' },
          { icon: Zap, label: 'Day Streak', value: streak, color: '#fbbf24' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="profile-stat-card" style={{ borderLeftColor: color }}>
            <Icon size={20} style={{ color }} />
            <div>
              <div className="pstat-value">{value}</div>
              <div className="pstat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Commit type breakdown */}
      <div className="profile-section-card">
        <h2 className="profile-section-title">Commit Type Breakdown</h2>
        <div className="type-bars">
          {[
            { type: 'feat', color: '#4ade80', label: 'New Chapters' },
            { type: 'fix', color: '#f87171', label: 'Course Corrections' },
            { type: 'chore', color: '#a78bfa', label: 'Maintenance' },
          ].map(({ type, color, label }) => {
            const pct = Math.round((typeCounts[type] / totalTyped) * 100);
            return (
              <div key={type} className="type-bar-row">
                <div className="type-bar-label">
                  <span className="type-bar-name" style={{ color }}>{type}</span>
                  <span className="type-bar-desc">{label}</span>
                </div>
                <div className="type-bar-track">
                  <div className="type-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="type-bar-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top branches */}
      {topBranches.length > 0 && (
        <div className="profile-section-card">
          <h2 className="profile-section-title">Most Active Branches</h2>
          <div className="top-branches">
            {topBranches.map(([name, count], i) => (
              <div key={name} className="top-branch-row">
                <span className="top-branch-rank">#{i + 1}</span>
                <span className="top-branch-name">{name}</span>
                <span className="top-branch-count">{count} decisions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity calendar */}
      <div className="profile-section-card">
        <h2 className="profile-section-title">Activity — Last 90 Days</h2>
        <div className="activity-calendar">
          {calendar.map((day, i) => (
            <div
              key={i}
              className="cal-day"
              style={{ background: calendarColor(day.count) }}
              title={`${day.date.toDateString()}: ${day.count} decision${day.count !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
        <div className="cal-legend">
          <span className="cal-legend-label">Less</span>
          {[0, 1, 2, 3].map(n => (
            <div key={n} className="cal-day" style={{ background: calendarColor(n) }} />
          ))}
          <span className="cal-legend-label">More</span>
        </div>
      </div>

      {/* Account */}
      <div className="profile-section-card profile-account">
        <h2 className="profile-section-title">Account</h2>
        <div className="account-row">
          <span className="account-label">Email</span>
          <span className="account-value">{user?.email}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
