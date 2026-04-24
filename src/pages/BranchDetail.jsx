import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GitBranch, ArrowLeft, Trash2, Edit2, Check, X, GitCommitHorizontal } from 'lucide-react';
import { api } from '../config/api';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import EmptyState from '../components/shared/EmptyState';
import SkeletonCard from '../components/shared/SkeletonCard';
import './BranchDetail.css';

function getStatusFromImpact(impact) {
  if (impact > 70) return { label: 'Thriving', cls: 'thriving' };
  if (impact >= 30) return { label: 'Stable', cls: 'stable' };
  return { label: 'Needs Work', cls: 'needs-work' };
}

function getTypeColor(type) {
  const map = { feat: '#4ade80', fix: '#f87171', chore: '#a78bfa' };
  return map[type] || '#9ca3af';
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [branch, setBranch] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showDeleteBranch, setShowDeleteBranch] = useState(false);
  const [deleteDecisionId, setDeleteDecisionId] = useState(null);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const b = await api.getBranch(id);
        setBranch(b);
        setNewName(b.name);
        const d = await api.getDecisionsByBranch(b.name);
        setDecisions(d);
      } catch (err) {
        addToast({ message: 'Failed to load branch', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSaveName = async () => {
    if (!newName.trim() || newName === branch.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await api.updateBranch(id, { name: newName.trim() });
      setBranch(prev => ({ ...prev, name: newName.trim() }));
      addToast({ message: `Branch renamed to "${newName.trim()}"`, type: 'success' });
      setEditingName(false);
    } catch {
      addToast({ message: 'Failed to rename branch', type: 'error' });
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteBranch = async () => {
    try {
      await api.deleteBranch(id);
      addToast({ message: `Branch "${branch.name}" deleted`, type: 'success' });
      navigate('/');
    } catch {
      addToast({ message: 'Failed to delete branch', type: 'error' });
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    try {
      await api.deleteDecision(decisionId);
      setDecisions(prev => prev.filter(d => (d._id || d.id) !== decisionId));
      addToast({ message: 'Decision deleted', type: 'success' });
    } catch {
      addToast({ message: 'Failed to delete decision', type: 'error' });
    }
  };

  const filtered = decisions
    .filter(d => filterType === 'all' || d.type === filterType)
    .filter(d => !search || d.decision?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const ta = new Date(a.timestamp || a.createdAt);
      const tb = new Date(b.timestamp || b.createdAt);
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });

  if (loading) {
    return (
      <div className="branch-detail page-content">
        <div className="branch-detail-skeletons">
          <SkeletonCard height="120px" lines={3} />
          {[1,2,3].map(i => <SkeletonCard key={i} height="80px" lines={2} />)}
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="branch-detail page-content">
        <EmptyState icon={GitBranch} title="Branch not found" description="This branch may have been deleted." actionLabel="Back to Dashboard" onAction={() => navigate('/')} />
      </div>
    );
  }

  const status = getStatusFromImpact(branch.impact || 0);
  const totalImpact = decisions.reduce((s, d) => s + (d.impact || 0), 0);

  return (
    <div className="branch-detail page-content">
      {/* Breadcrumb */}
      <nav className="branch-breadcrumb">
        <Link to="/" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{branch.name}</span>
      </nav>

      {/* Branch header */}
      <div className="branch-header-card">
        <div className="branch-header-top">
          <div className="branch-name-area">
            {editingName ? (
              <div className="branch-name-edit">
                <input
                  className="branch-name-input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  autoFocus
                />
                <button className="icon-btn green" onClick={handleSaveName} disabled={savingName}><Check size={16} /></button>
                <button className="icon-btn" onClick={() => setEditingName(false)}><X size={16} /></button>
              </div>
            ) : (
              <div className="branch-name-display">
                <GitBranch size={20} className="branch-name-icon" />
                <span className="branch-name-text">{branch.name}</span>
                <button className="icon-btn" onClick={() => setEditingName(true)} title="Rename"><Edit2 size={15} /></button>
              </div>
            )}
          </div>
          <button className="delete-branch-btn" onClick={() => setShowDeleteBranch(true)}>
            <Trash2 size={16} />
            Delete Branch
          </button>
        </div>

        <div className="branch-badges">
          <span className="branch-type-badge">{branch.type || 'main'}</span>
          <span className={`branch-status-badge ${status.cls}`}>{status.label}</span>
        </div>

        <div className="branch-stats-row">
          <div className="branch-stat">
            <span className="branch-stat-label">Created</span>
            <span className="branch-stat-value">{new Date(branch.createdAt || branch.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="branch-stat">
            <span className="branch-stat-label">Decisions</span>
            <span className="branch-stat-value">{decisions.length}</span>
          </div>
          <div className="branch-stat">
            <span className="branch-stat-label">Total Impact</span>
            <span className="branch-stat-value accent">{totalImpact}</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="branch-filter-bar">
        <div className="filter-pills">
          {['all', 'feat', 'fix', 'chore'].map(t => (
            <button key={t} className={`filter-pill ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <input
          className="filter-search"
          placeholder="Search decisions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-sort" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      {/* Decision list */}
      {filtered.length === 0 ? (
        <EmptyState icon={GitCommitHorizontal} title="No decisions here" description={search ? 'Try a different search term.' : 'Make a life choice in this branch to see it here.'} />
      ) : (
        <div className="decision-list">
          {filtered.map(d => {
            const did = d._id || d.id;
            return (
              <div key={did} className="decision-card">
                <div className="decision-card-main">
                  <span className="decision-type-badge" style={{ color: getTypeColor(d.type), borderColor: getTypeColor(d.type) }}>{d.type}</span>
                  <p className="decision-text">{d.decision}</p>
                  <div className="decision-meta">
                    <span className="decision-mood">{d.mood}</span>
                    <span className="decision-impact">Impact: <strong>{d.impact}</strong></span>
                    <span className="decision-time">{timeAgo(d.timestamp || d.createdAt)}</span>
                  </div>
                </div>
                <button className="decision-delete-btn" onClick={() => setDeleteDecisionId(did)} title="Delete decision">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteBranch}
        onClose={() => setShowDeleteBranch(false)}
        onConfirm={handleDeleteBranch}
        title="Delete Branch"
        message={`Delete "${branch.name}"? Decisions in this branch will remain in your commit history but become unlinked.`}
        confirmLabel="Delete Branch"
      />

      <ConfirmDialog
        isOpen={!!deleteDecisionId}
        onClose={() => setDeleteDecisionId(null)}
        onConfirm={() => handleDeleteDecision(deleteDecisionId)}
        title="Delete Decision"
        message="This decision will be permanently removed from your history."
        confirmLabel="Delete"
      />
    </div>
  );
}
