// Navbar.jsx
import React, { useState, useEffect } from 'react';
import { GitBranch } from 'lucide-react';
import { addDecision } from '../config/addDecision';
import { addBranch } from '../config/addBranch';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './Navbar.css';

const Navbar = () => {
  const [stats, setStats] = useState({
    decisions: 2,
    regrets: '∞',
    caffeineCommits: 3,
    achievementScore: 404
  });

  const [showLifeChoiceForm, setShowLifeChoiceForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState(['main-timeline']);

  const [decisionForm, setDecisionForm] = useState({
    decision: '',
    branch: 'main-timeline',
    mood: '😊',
    impact: 5,
    commitType: 'feat'
  });

  const [branchForm, setBranchForm] = useState({
    branch_name: '',
    branch_type: 'main'
  });

  const moodOptions = ['😊', '😐', '😢', '😡', '🤔', '😴', '🤩', '😰', '🤮', '🥳'];
  const commitTypes = ['feat', 'fix', 'chore'];
  const branchTypes = ['main', 'feature', 'what-if', 'alternative'];

  // Fetch branches from Firestore
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'branches'));

        const branchList = querySnapshot.docs
          .map(doc => doc.data().name)
          .filter(branch => branch !== undefined);

        if (branchList.length > 0) {
          setBranches(branchList);
          setDecisionForm(prev => ({
            ...prev,
            branch: 'main-timeline'
          }));
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        alert('Could not fetch branches. Please try again later.');
      }
    };

    fetchBranches();
  }, []);

  const handleLifeChoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDecision(decisionForm);
      setShowLifeChoiceForm(false);
      setDecisionForm({
        decision: '',
        branch: branches[0],
        mood: '😊',
        impact: 5,
        commitType: 'feat'
      });
    } catch (error) {
      console.error('Error adding decision:', error);
      alert('Failed to add decision. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!branchForm.branch_name.trim()) {
        throw new Error('Branch name is required');
      }

      await addBranch(branchForm);
      setBranches(prev => [...prev, branchForm.branch_name]);
      setShowBranchForm(false);
      setBranchForm({
        branch_name: '',
        branch_type: 'main'
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      alert(error.message || 'Failed to create branch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDecisionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBranchInputChange = (e) => {
    const { name, value } = e.target;
    setBranchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <div className="navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <div className="logo">
              <svg className="git-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <GitBranch />
              </svg>
              <h1>GitLife</h1>
            </div>
          </div>

          <div className="navbar-right">
            <button
              className="btn btn-primary"
              onClick={() => setShowLifeChoiceForm(!showLifeChoiceForm)}
            >
              Make Life Choice
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowBranchForm(!showBranchForm)}
            >
              Create "What If" Branch
            </button>
          </div>
        </div>
      </div>

      {showLifeChoiceForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <form onSubmit={handleLifeChoice} className="decision-form">
              <div className="modal-header">
                <h3>Commit New Decision</h3>
              </div>

              <div className="form-group">
                <label>Commit Type</label>
                <div className="commit-type-selector">
                  {commitTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`commit-type-button ${decisionForm.commitType === type ? 'selected' : ''}`}
                      onClick={() => setDecisionForm(prev => ({ ...prev, commitType: type }))}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Decision</label>
                <textarea
                  name="decision"
                  value={decisionForm.decision}
                  onChange={handleInputChange}
                  placeholder="What decision did you make?"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Branch</label>
                <select
                  name="branch"
                  value={decisionForm.branch}
                  onChange={handleInputChange}
                  className="branch-select"
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Current Mood</label>
                <div className="mood-selector">
                  {moodOptions.map(mood => (
                    <button
                      key={mood}
                      type="button"
                      className={`mood-button ${decisionForm.mood === mood ? 'selected' : ''}`}
                      onClick={() => setDecisionForm(prev => ({ ...prev, mood: mood }))}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Impact Score (1-100)</label>
                <div className="impact-slider-container">
                  <input
                    type="range"
                    name="impact"
                    min="1"
                    max="100"
                    value={decisionForm.impact}
                    onChange={handleInputChange}
                    className="impact-slider"
                  />
                  <span className="impact-value">{decisionForm.impact}</span>
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Committing...' : 'Commit Decision'}
                </button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowLifeChoiceForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBranchForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <form onSubmit={handleBranchCreate}>
              <div className="modal-header">
                <h3>Create New Branch</h3>
              </div>

              <div className="form-group">
                <label>Branch Name</label>
                <input
                  type="text"
                  name="branch_name"
                  value={branchForm.branch_name}
                  onChange={handleBranchInputChange}
                  placeholder="Enter branch name..."
                  className="branch-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Branch Type</label>
                <select
                  name="branch_type"
                  value={branchForm.branch_type}
                  onChange={handleBranchInputChange}
                  className="branch-select"
                >
                  {branchTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Branch'}
                </button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowBranchForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;