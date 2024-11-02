// Navbar.jsx
import React, { useState } from 'react';
import { GitBranch } from 'lucide-react';

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

  const [decisionForm, setDecisionForm] = useState({
    decision: '',
    branch: 'main-timeline',
    mood: '😊',
    impact: 5
  });

  const moodOptions = ['😊', '😐', '😢', '😡', '🤔', '😴', '🤩', '😰', '🤮', '🥳'];
  const branchOptions = ['main-timeline', 'what-if/dropout-startup'];

  const handleLifeChoice = (e) => {
    e.preventDefault();
    console.log('New Decision:', decisionForm);
    setShowLifeChoiceForm(false);
    setDecisionForm({
      decision: '',
      branch: 'main-timeline',
      mood: '😊',
      impact: 5
    });
  };

  const handleBranchCreate = (e) => {
    e.preventDefault();
    setShowBranchForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDecisionForm(prev => ({
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
                <label>Decision</label>
                <textarea
                  name="decision"
                  value={decisionForm.decision}
                  onChange={handleInputChange}
                  placeholder="What decision did you make?"
                  rows="3"
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
                  {branchOptions.map(branch => (
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
                      onClick={() => setDecisionForm(prev => ({ ...prev, mood }))}
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
                <button type="submit" className="btn btn-primary">Commit Decision</button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowLifeChoiceForm(false)}
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
              <input
                type="text"
                placeholder="Enter branch name..."
                className="branch-input"
              />
              <div className="modal-buttons">
                <button type="submit" className="btn btn-primary">Create</button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowBranchForm(false)}
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