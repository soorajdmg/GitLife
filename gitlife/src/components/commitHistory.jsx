import React from 'react';
import { Clock, GitBranch } from 'lucide-react';
import './commitHistory.css';

const commitHistory = () => {
  const commits = [
    {
      id: 1,
      hash: "8f4e2d1",
      timeAgo: "2 hours ago",
      message: "fix(productivity): Scroll through social media for 3 hours instead of working",
      type: "fix"
    },
    {
      id: 2,
      hash: "3a1b9c7",
      timeAgo: "5 hours ago",
      message: "merge: Combine 'learn-to-cook' branch with 'order-takeout' branch",
      type: "merge"
    }
  ];

  const getCommitTypeColor = (type) => {
    const types = {
      fix: '#f87171',
      feat: '#4ade80',
      merge: '#60a5fa',
      refactor: '#a78bfa',
      default: '#9ca3af'
    };
    return types[type] || types.default;
  };

  return (
    <div className="commit-section">
      <div className="commit-header">
        <Clock className="commit-header-icon" />
        <h2 className="commit-title">Recent Life Commits</h2>
      </div>

      <div className="commit-container">
        {commits.map(commit => (
          <div key={commit.id} className="commit-card">
            <div className="commit-info">
              <GitBranch className="commit-branch-icon" />
              <code className="commit-hash">{commit.hash}</code>
              <span className="commit-time">{commit.timeAgo}</span>
            </div>
            
            <div className="commit-message-container">
              <span 
                className="commit-type"
                style={{ color: getCommitTypeColor(commit.type.split('(')[0]) }}
              >
                {commit.type}
              </span>
              <p className="commit-message">
                {commit.message.substring(commit.message.indexOf(':') + 1).trim()}
              </p>
            </div>
            
            <div className="commit-hover-info">
              <div className="commit-details">
                <span className="detail-label">Full Hash:</span>
                <code className="detail-value">{commit.hash.repeat(5)}</code>
              </div>
              <button className="copy-hash-btn">
                Copy Hash
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default commitHistory;