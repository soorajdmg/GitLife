import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import './MoodChart.css';

const MOOD_VALUES = {
  '🤩': 5, '🥳': 5, '😊': 4, '😐': 3, '🤔': 3,
  '😴': 2, '😢': 2, '😡': 1, '😰': 1, '🤮': 1,
};

function moodLabel(val) {
  if (val >= 4.5) return 'Excellent';
  if (val >= 3.5) return 'Good';
  if (val >= 2.5) return 'Neutral';
  if (val >= 1.5) return 'Low';
  return 'Rough';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mood-tooltip">
      <span className="mood-tooltip-label">{label}</span>
      <span className="mood-tooltip-val">{moodLabel(payload[0]?.value)}</span>
    </div>
  );
}

export default function MoodChart() {
  const { refreshTrigger } = useDataRefresh();
  const [chartData, setChartData] = useState([]);
  const [recentMoods, setRecentMoods] = useState([]);
  const [avgMood, setAvgMood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let first = true;
    const fetch = async () => {
      try {
        const decisions = await api.getDecisions({ limit: 50, sortBy: 'timestamp', sortOrder: 'desc' });
        const withMood = decisions.filter(d => d.mood && MOOD_VALUES[d.mood] !== undefined);

        // Recent 7 moods (latest first, reversed for display)
        setRecentMoods(withMood.slice(0, 7).map(d => d.mood).reverse());

        if (withMood.length === 0) { setChartData([]); return; }

        // Group by date, average mood per day — last 14 days
        const byDate = {};
        withMood.forEach(d => {
          const key = new Date(d.timestamp || d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!byDate[key]) byDate[key] = [];
          byDate[key].push(MOOD_VALUES[d.mood]);
        });

        const points = Object.entries(byDate)
          .slice(-14)
          .map(([day, vals]) => ({
            day,
            mood: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
          }));

        setChartData(points.reverse().slice(-14).reverse());

        const all = withMood.map(d => MOOD_VALUES[d.mood]);
        setAvgMood(Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10);
      } catch { /* keep */ }
      finally { if (first) { setLoading(false); first = false; } }
    };
    fetch();
  }, [refreshTrigger]);

  if (loading || chartData.length === 0) return null; // don't show if no mood data

  return (
    <div className="mood-chart-card">
      <div className="mood-chart-header">
        <div className="mood-chart-title-area">
          <h3 className="mood-chart-title">Mood Trend</h3>
          {avgMood && (
            <span className="mood-avg-badge">{moodLabel(avgMood)} avg</span>
          )}
        </div>
        <div className="recent-moods">
          {recentMoods.map((m, i) => (
            <span key={i} className="recent-mood-emoji" title="Recent mood">{m}</span>
          ))}
        </div>
      </div>
      <div className="mood-area-chart">
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="none" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="mood" stroke="var(--accent-green)" strokeWidth={2}
              fill="url(#moodGrad)" dot={false} activeDot={{ r: 4, fill: 'var(--accent-green)' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
