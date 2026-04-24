import { useState, useEffect } from 'react';
import { Clock, GitBranch, Copy, Check, Trash2 } from 'lucide-react';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import { useToast } from '../contexts/ToastContext';
import SkeletonCard from './shared/SkeletonCard';
import EmptyState from './shared/EmptyState';
import ConfirmDialog from './shared/ConfirmDialog';
import './commitHistory.css';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function typeColor(type) {
  return { feat: '#4ade80', fix: '#f87171', chore: '#a78bfa' }[type] || '#9ca3af';
}

export default function CommitHistory() {
  const { refreshTrigger, refreshAfterDecision } = useDataRefresh();
  const { addToast } = useToast();
  const [allCommits, setAllCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    let first = true;
    const fetch = async () => {
      try {
        const decisions = await api.getDecisions({ limit: 50, sortBy: 'timestamp', sortOrder: 'desc' });
        setAllCommits(decisions.map(d => ({
          id: d._id || d.id,
          decision: d.decision || d.message || 'No description',
          type: d.type || 'chore',
          mood: d.mood,
          impact: d.impact,
          branch_name: d.branch_name || d.branch || '—',
          timeAgo: timeAgo(d.timestamp || d.createdAt),
        })));
      } catch { /* keep */ }
      finally { if (first) { setLoading(false); first = false; } }
    };
    fetch();
  }, [refreshTrigger]);

  const copyImpact = (id, impact) => {
    navigator.clipboard.writeText(String(impact));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    try {
      await api.deleteDecision(deleteId);
      setAllCommits(prev => prev.filter(c => c.id !== deleteId));
      refreshAfterDecision();
      addToast({ message: 'Decision deleted', type: 'success' });
    } catch {
      addToast({ message: 'Failed to delete decision', type: 'error' });
    }
  };

  const filtered = allCommits
    .filter(c => filterType === 'all' || c.type === filterType)
    .filter(c => !search || c.decision.toLowerCase().includes(search.toLowerCase()) || c.branch_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="commit-section">
      <div className="commit-header">
        <Clock className="commit-header-icon" />
        <h2 className="commit-title">Recent Life Commits</h2>
      </div>

      {/* Filter bar */}
      <div className="commit-filter-bar">
        <div className="commit-filter-pills">
          {['all', 'feat', 'fix', 'chore'].map(t => (
            <button key={t} className={`commit-filter-pill ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <input
          className="commit-search"
          placeholder="Search decisions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="commit-container">
        {loading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} height="80px" lines={2} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={search || filterType !== 'all' ? 'No matches found' : 'No commits yet'}
            description={search || filterType !== 'all' ? 'Try adjusting your search or filter.' : 'Make a life choice to see it here.'}
          />
        ) : (
          filtered.map(commit => (
            <div key={commit.id} className="commit-card">
              <div className="commit-main">
                <div className="commit-info">
                  <GitBranch size={14} className="commit-branch-icon" />
                  <code className="commit-hash">{commit.branch_name}</code>
                  <span className="commit-time">{commit.timeAgo}</span>
                </div>
                <div className="commit-body">
                  <span className="commit-type" style={{ color: typeColor(commit.type) }}>{commit.type}</span>
                  <p className="commit-message">
                    {commit.decision.includes(':')
                      ? commit.decision.substring(commit.decision.indexOf(':') + 1).trim()
                      : commit.decision}
                    {commit.mood && <span className="commit-mood"> {commit.mood}</span>}
                  </p>
                </div>
              </div>

              <div className="commit-actions">
                <span className="commit-impact-badge">+{commit.impact}</span>
                <button
                  className="commit-action-btn"
                  onClick={() => copyImpact(commit.id, commit.impact)}
                  title="Copy impact score"
                >
                  {copiedId === commit.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  className="commit-action-btn danger"
                  onClick={() => setDeleteId(commit.id)}
                  title="Delete decision"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Decision"
        message="This decision will be permanently removed from your history."
        confirmLabel="Delete"
      />
    </div>
  );
}
