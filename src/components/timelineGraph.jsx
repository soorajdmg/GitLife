import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartLine } from 'lucide-react';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import SkeletonCard from './shared/SkeletonCard';
import EmptyState from './shared/EmptyState';
import './timelineGraph.css';

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: 'All', days: null },
];

function processDecisions(decisions, branches, days) {
  if (decisions.length === 0) return [];

  let filtered = decisions;
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    filtered = decisions.filter(d => new Date(d.timestamp) >= cutoff);
  }
  if (filtered.length === 0) return [];

  const byDate = {};
  filtered.forEach(d => {
    const dateKey = new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!byDate[dateKey]) byDate[dateKey] = { main: [], whatIf: [] };
    const branch = branches.find(b => b.name === d.branch_name);
    const isWhatIf = branch && (branch.type === 'what-if' || branch.type === 'alternative');
    if (isWhatIf) byDate[dateKey].whatIf.push(d);
    else byDate[dateKey].main.push(d);
  });

  let cumMain = 0, cumWhatIf = 0;
  return Object.entries(byDate).map(([date, data]) => {
    const mainAvg = data.main.length ? data.main.reduce((s, d) => s + (d.impact || 0), 0) / data.main.length : 0;
    const whatIfAvg = data.whatIf.length ? data.whatIf.reduce((s, d) => s + (d.impact || 0), 0) / data.whatIf.length : 0;
    cumMain += mainAvg;
    cumWhatIf += whatIfAvg;
    return {
      day: date,
      currentTimeline: Math.min(Math.round(cumMain), 100),
      whatIf: Math.min(Math.round(cumWhatIf), 100),
      mainDecisions: data.main.length,
      whatIfDecisions: data.whatIf.length,
    };
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="timeline-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="timeline-value">
        <span className="dot current-dot" />
        Main: {payload[0]?.value || 0}
        {data?.mainDecisions > 0 && ` (${data.mainDecisions})`}
      </p>
      {payload[1] && (
        <p className="whatif-value">
          <span className="dot whatif-dot" />
          What If: {payload[1]?.value || 0}
          {data?.whatIfDecisions > 0 && ` (${data.whatIfDecisions})`}
        </p>
      )}
    </div>
  );
}

export default function TimelineGraph() {
  const { refreshTrigger } = useDataRefresh();
  const [allDecisions, setAllDecisions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeIdx, setRangeIdx] = useState(2); // default All

  useEffect(() => {
    let first = true;
    const fetch = async () => {
      try {
        const [decisions, branchData] = await Promise.all([
          api.getDecisions({ sortBy: 'timestamp', sortOrder: 'asc' }),
          api.getBranches()
        ]);
        setAllDecisions(decisions);
        setBranches(branchData);
      } catch { /* keep previous */ }
      finally { if (first) { setLoading(false); first = false; } }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const chartData = processDecisions(allDecisions, branches, RANGES[rangeIdx].days);

  return (
    <div className="timelineg-section">
      <div className="timelinesg-header">
        <ChartLine className="timelineg-header-icon" />
        <div className="timelineg-title-group">
          <h2 className="timelineg-title">Life Branches</h2>
          <p className="timelineg-subtitle">Cumulative impact across your life branches</p>
        </div>
        <div className="timelineg-range-pills">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              className={`range-pill ${rangeIdx === i ? 'active' : ''}`}
              onClick={() => setRangeIdx(i)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="timelineg-container">
        {loading ? (
          <SkeletonCard height="400px" lines={3} />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={ChartLine}
            title="No data yet"
            description="Start making life choices to see your timeline graph."
          />
        ) : (
          <div className="timelineg-content">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis stroke="var(--text-muted)" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    label={{ value: 'Impact', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="currentTimeline" stroke="#8884d8" strokeWidth={3}
                    name="Main Timeline" dot={{ r: 4, fill: '#8884d8', stroke: 'var(--bg-elevated)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="whatIf" stroke="#82ca9d" strokeWidth={3}
                    name="What If..." strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#82ca9d', stroke: 'var(--bg-elevated)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="timelineg-legend">
              <div className="legend-item"><span className="legend-line current" /><span>Main Timeline</span></div>
              <div className="legend-item"><span className="legend-line whatif" /><span>What If Branches</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
