import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, GitFork, Menu, X, ChartLine } from 'lucide-react';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import { useToast } from '../contexts/ToastContext';
import Modal from './shared/Modal';
import './navbar.css';

function getInitials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#10b981', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171'];
  let hash = 0;
  for (let c of (name || '')) hash = (hash << 5) - hash + c.charCodeAt(0);
  return colors[Math.abs(hash) % colors.length];
}

function getImpactLabel(val) {
  if (val <= 33) return 'Minor';
  if (val <= 66) return 'Significant';
  return 'Life-changing';
}

const MOOD_OPTIONS = ['😊', '😐', '😢', '😡', '🤔', '😴', '🤩', '😰', '🤮', '🥳'];
const COMMIT_TYPES = [
  { value: 'feat', label: 'feat', desc: 'new chapter' },
  { value: 'fix', label: 'fix', desc: 'course correction' },
  { value: 'chore', label: 'chore', desc: 'maintenance' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { refreshAfterDecision, refreshAfterBranch } = useDataRefresh();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState(['main-timeline']);

  const [decisionForm, setDecisionForm] = useState({
    decision: '',
    branch_name: 'main-timeline',
    mood: '😊',
    impact: 5,
    type: 'feat'
  });

  const [branchForm, setBranchForm] = useState({ name: '', type: 'main' });
  const [branchNameError, setBranchNameError] = useState('');

  useEffect(() => {
    api.getBranches()
      .then(data => {
        const names = data.map(b => b.name).filter(Boolean);
        if (names.length > 0) {
          setBranches(names);
          setDecisionForm(prev => ({ ...prev, branch_name: names[0] }));
        }
      })
      .catch(() => {});
  }, []);

  // Breadcrumbs
  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/branches/')) return 'Branch Detail';
    if (location.pathname === '/profile') return 'Profile';
    return null;
  };
  const breadcrumb = getBreadcrumb();

  const handleDecisionChange = (e) => {
    const { name, value } = e.target;
    setDecisionForm(prev => ({ ...prev, [name]: name === 'impact' ? Number(value) : value }));
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!decisionForm.decision.trim()) return;
    setLoading(true);
    try {
      await api.createDecision({ ...decisionForm, timestamp: new Date().toISOString() });
      setShowDecisionModal(false);
      setDecisionForm({ decision: '', branch_name: branches[0] || 'main-timeline', mood: '😊', impact: 5, type: 'feat' });
      refreshAfterDecision();
      addToast({ message: `Decision committed to "${decisionForm.branch_name}"`, type: 'success' });
    } catch (err) {
      addToast({ message: err.message || 'Failed to commit decision', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBranchNameChange = (e) => {
    const val = e.target.value;
    setBranchForm(prev => ({ ...prev, name: val }));
    if (val && !/^[a-zA-Z0-9 _-]+$/.test(val)) {
      setBranchNameError('Only letters, numbers, spaces, hyphens, and underscores');
    } else {
      setBranchNameError('');
    }
  };

  const handleSubmitBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim() || branchNameError) return;
    setLoading(true);
    try {
      await api.createBranch({
        name: branchForm.name.trim(),
        type: branchForm.type,
        commits: 0, impact: 0, status: 'needs-work',
        timestamp: new Date().toISOString()
      });
      setBranches(prev => [...prev, branchForm.name.trim()]);
      setShowBranchModal(false);
      setBranchForm({ name: '', type: 'main' });
      refreshAfterBranch();
      addToast({ message: `Branch "${branchForm.name.trim()}" created`, type: 'success' });
    } catch (err) {
      addToast({ message: err.message || 'Failed to create branch', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setMenuOpen(false);
  };

  const charCount = decisionForm.decision.length;
  const impactLabel = getImpactLabel(decisionForm.impact);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          {/* Left: logo + breadcrumb */}
          <div className="navbar-left">
            <Link to="/" className="nav-logo">
              <GitBranch size={22} className="nav-logo-icon" />
              <span className="nav-logo-text">GitLife</span>
            </Link>
            {breadcrumb && (
              <div className="nav-breadcrumb">
                <span className="nav-breadcrumb-sep">›</span>
                <span className="nav-breadcrumb-page">{breadcrumb}</span>
              </div>
            )}
          </div>

          {/* Center: nav links (desktop) */}
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
          </div>

          {/* Right: action buttons + avatar (desktop) */}
          <div className="navbar-right">
            <button className="nav-btn nav-btn-primary" onClick={() => setShowDecisionModal(true)}>
              <Plus size={16} />
              Commit
            </button>
            <button className="nav-btn nav-btn-secondary" onClick={() => setShowBranchModal(true)}>
              <GitFork size={15} />
              Branch
            </button>
            <button
              className="nav-avatar"
              onClick={() => navigate('/profile')}
              style={{ background: getAvatarColor(user?.username) }}
              title={user?.username}
            >
              {getInitials(user?.username)}
            </button>
          </div>

          {/* Hamburger (mobile) */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`nav-drawer ${menuOpen ? 'open' : ''}`}>
          <div className="nav-drawer-links">
            <NavLink to="/" end className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              <ChartLine size={17} /> Dashboard
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              <GitBranch size={17} /> Profile
            </NavLink>
          </div>
          <div className="nav-drawer-actions">
            <button className="nav-btn nav-btn-primary drawer-action-btn" onClick={() => { setShowDecisionModal(true); setMenuOpen(false); }}>
              <Plus size={16} /> Make Life Choice
            </button>
            <button className="nav-btn nav-btn-secondary drawer-action-btn" onClick={() => { setShowBranchModal(true); setMenuOpen(false); }}>
              <GitFork size={15} /> Create Branch
            </button>
            <button className="drawer-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Decision Modal */}
      <Modal isOpen={showDecisionModal} onClose={() => setShowDecisionModal(false)} title="Commit New Decision">
        <form onSubmit={handleSubmitDecision} className="modal-form">
          {/* Commit type */}
          <div className="mf-group">
            <label className="mf-label">Commit Type</label>
            <div className="commit-type-row">
              {COMMIT_TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  className={`commit-type-btn ${decisionForm.type === value ? 'selected' : ''}`}
                  onClick={() => setDecisionForm(prev => ({ ...prev, type: value }))}
                >
                  <span className="ct-label">{label}</span>
                  <span className="ct-desc">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Decision text */}
          <div className="mf-group">
            <div className="mf-label-row">
              <label className="mf-label">Decision</label>
              <span className={`char-counter ${charCount > 450 ? 'warn' : ''}`}>{charCount}/500</span>
            </div>
            <textarea
              name="decision"
              value={decisionForm.decision}
              onChange={handleDecisionChange}
              placeholder="What decision did you make?"
              rows={3}
              maxLength={500}
              required
              className="mf-textarea"
            />
          </div>

          {/* Branch */}
          <div className="mf-group">
            <label className="mf-label">Branch</label>
            <select name="branch_name" value={decisionForm.branch_name} onChange={handleDecisionChange} className="mf-select">
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Mood */}
          <div className="mf-group">
            <label className="mf-label">Current Mood</label>
            <div className="mood-grid">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood}
                  type="button"
                  className={`mood-btn ${decisionForm.mood === mood ? 'selected' : ''}`}
                  onClick={() => setDecisionForm(prev => ({ ...prev, mood }))}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Impact */}
          <div className="mf-group">
            <div className="mf-label-row">
              <label className="mf-label">Impact Score</label>
              <span className="impact-label-text">{impactLabel} — <strong className="impact-val">{decisionForm.impact}</strong></span>
            </div>
            <input
              type="range"
              name="impact"
              min="1" max="100"
              value={decisionForm.impact}
              onChange={handleDecisionChange}
              className="impact-slider"
            />
          </div>

          <div className="mf-actions">
            <button type="button" className="mf-cancel" onClick={() => setShowDecisionModal(false)} disabled={loading}>Cancel</button>
            <button type="submit" className="mf-submit" disabled={loading || !decisionForm.decision.trim()}>
              {loading ? 'Committing...' : 'Commit Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Branch Modal */}
      <Modal isOpen={showBranchModal} onClose={() => setShowBranchModal(false)} title="Create New Branch">
        <form onSubmit={handleSubmitBranch} className="modal-form">
          <div className="mf-group">
            <label className="mf-label">Branch Name</label>
            <input
              type="text"
              value={branchForm.name}
              onChange={handleBranchNameChange}
              placeholder="e.g. career-change-2025"
              className={`mf-input ${branchNameError ? 'error' : ''}`}
              required
            />
            {branchNameError && <p className="mf-field-error">{branchNameError}</p>}
          </div>

          <div className="mf-group">
            <label className="mf-label">Branch Type</label>
            <div className="branch-type-cards">
              {[
                { value: 'main', icon: '━━', label: 'Main Timeline', desc: 'Your primary life path' },
                { value: 'what-if', icon: '╌╌', label: 'What If', desc: 'Explore hypotheticals' },
                { value: 'alternative', icon: '⌥', label: 'Alternative', desc: 'Different direction' },
              ].map(({ value, icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  className={`branch-type-card ${branchForm.type === value ? 'selected' : ''}`}
                  onClick={() => setBranchForm(prev => ({ ...prev, type: value }))}
                >
                  <span className="btc-icon">{icon}</span>
                  <span className="btc-label">{label}</span>
                  <span className="btc-desc">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mf-actions">
            <button type="button" className="mf-cancel" onClick={() => setShowBranchModal(false)} disabled={loading}>Cancel</button>
            <button type="submit" className="mf-submit" disabled={loading || !branchForm.name.trim() || !!branchNameError}>
              {loading ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
