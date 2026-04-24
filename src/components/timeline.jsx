import { useState, useEffect } from 'react';
import { GitFork, GitBranch, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import { useToast } from '../contexts/ToastContext';
import SkeletonCard from './shared/SkeletonCard';
import EmptyState from './shared/EmptyState';
import ConfirmDialog from './shared/ConfirmDialog';
import './timeline.css';

function getStatus(impact) {
  if (impact > 70) return { label: 'Thriving',    cls: 'thriving' };
  if (impact >= 30) return { label: 'Stable',      cls: 'stable' };
  return              { label: 'Needs Work',  cls: 'needs-work' };
}

export default function Timelines() {
  const { refreshTrigger, refreshAfterBranch } = useDataRefresh();
  const { addToast } = useToast();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    let first = true;
    const fetchData = async () => {
      try {
        const [branchesData, decisionsData] = await Promise.all([
          api.getBranches(),
          api.getDecisions()
        ]);
        const statsMap = new Map();
        branchesData.forEach(b => statsMap.set(b.name, { ...b, commits: 0, impact: 0 }));
        decisionsData.forEach(d => {
          const name = d.branch_name || d.branch;
          if (name && statsMap.has(name)) {
            const s = statsMap.get(name);
            s.commits += 1;
            s.impact += parseInt(d.impact, 10) || 0;
          }
        });
        setBranches(Array.from(statsMap.values()));
      } catch { /* keep */ }
      finally { if (first) { setLoading(false); first = false; } }
    };
    fetchData();
  }, [refreshTrigger]);

  const handleDelete = async (branch) => {
    try {
      await api.deleteBranch(branch._id || branch.id);
      setBranches(prev => prev.filter(b => (b._id || b.id) !== (branch._id || branch.id)));
      refreshAfterBranch();
      addToast({ message: `Branch "${branch.name}" deleted`, type: 'success' });
    } catch {
      addToast({ message: 'Failed to delete branch', type: 'error' });
    }
  };

  const deletingBranch = branches.find(b => (b._id || b.id) === deleteId);

  return (
    <div className="timelines-section">
      <div className="timelines-header">
        <GitFork className="timeline-header-icon" />
        <h2 className="timelines-title">Active Timelines</h2>
        <span className="timelines-count">{branches.length}</span>
      </div>

      <div className="timelines-container">
        {loading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} height="72px" lines={2} />)
        ) : branches.length === 0 ? (
          <EmptyState
            icon={GitFork}
            title="No branches yet"
            description="Create a branch to start tracking different life paths."
          />
        ) : (
          branches.map(branch => {
            const id = branch._id || branch.id;
            const status = getStatus(branch.impact);
            return (
              <div key={id} className="timeline-card">
                <Link to={`/branches/${id}`} className="timeline-card-link">
                  <div className="timeline-info">
                    <span className="timeline-name">{branch.name}</span>
                    <span className="timeline-type">{branch.type || 'main'}</span>
                  </div>
                  <div className="timeline-stats">
                    <div className="stat-item">
                      <GitBranch size={14} className="stat-icon" />
                      <span className="stat-val">{branch.commits}</span>
                    </div>
                    <div className="stat-item">
                      <span className={`impact-val ${branch.impact >= 0 ? 'positive' : 'negative'}`}>
                        {branch.impact > 0 ? `+${branch.impact}` : branch.impact}
                      </span>
                    </div>
                    <span className={`status-badge ${status.cls}`}>{status.label}</span>
                  </div>
                </Link>
                <button
                  className="branch-delete-btn"
                  onClick={e => { e.preventDefault(); setDeleteId(id); }}
                  title="Delete branch"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deletingBranch && handleDelete(deletingBranch)}
        title="Delete Branch"
        message={`Delete "${deletingBranch?.name}"? Decisions in this branch remain in your history but become unlinked.`}
        confirmLabel="Delete Branch"
      />
    </div>
  );
}
