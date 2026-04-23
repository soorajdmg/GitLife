import React, { useState, useEffect } from 'react';
import { Clock, GitBranch, Copy, Check } from 'lucide-react';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import './commitHistory.css';

const CommitHistory = () => {
  const { refreshTrigger } = useDataRefresh();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // Helper function to safely convert timestamp to Date
  const convertTimestamp = (timestamp) => {
    if (!timestamp) return null;

    // Handle ISO date string (e.g., "2024-11-02T12:40:27.766Z")
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  };

  useEffect(() => {
    let isFirstFetch = true;

    const fetchCommits = async () => {
      try {
        if (isFirstFetch) setLoading(true);
        const decisions = await api.getDecisions({
          limit: 10,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });

        const commitsList = decisions.map(data => {
          const date = convertTimestamp(data.timestamp);

          return {
            id: data.id,
            hash: data.id.substring(0, 7),
            timeAgo: date ? calculateTimeAgo(date) : 'unknown time ago',
            message: data.message || 'No message provided',
            type: data.type || 'default',
            fullHash: data.id,
            impact: data.impact,
            timestamp: date,
            branch_name: data.branch_name || data.branch || data.id.substring(0, 7),
            decision: data.decision || data.message || 'No description available',
            mood: data.mood
          };
        });

        setCommits(commitsList);
        if (isFirstFetch) {
          setLoading(false);
          isFirstFetch = false;
        }
      } catch (err) {
        console.error('Error fetching commits:', err);
        setError(err.message);
        if (isFirstFetch) {
          setLoading(false);
          isFirstFetch = false;
        }
      }
    };

    fetchCommits();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCommits, 30000);

    return () => clearInterval(interval);
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  const calculateTimeAgo = (date) => {
    if (!date) return 'unknown time ago';

    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return Math.floor(seconds) + ' seconds ago';
  };

  const getCommitTypeColor = (type) => {
    const types = {
      fix: '#f87171',
      feat: '#4ade80',
      chore: '#a78bfa',
      default: '#9ca3af'
    };
    return types[type.split('(')[0]] || types.default;
  };

  const copyToClipboard = (impact) => {
    navigator.clipboard.writeText(impact);
    setCopiedHash(impact);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (loading) {
    return (
      <div className="commit-section">
        <div className="loading-state">Loading commits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="commit-section">
        <div className="error-state">Error loading commits: {error}</div>
      </div>
    );
  }

  return (
    <div className="commit-section">
      <div className="commit-header">
        <Clock className="commit-header-icon" />
        <h2 className="commit-title">Recent Life Commits</h2>
      </div>

      <div className="commit-container">
        {commits.length === 0 ? (
          <div className="no-commits">No commits found</div>
        ) : (
          commits.map(commit => (
            <div key={commit.id} className="commit-card">
              <div className="commit-info">
                <GitBranch className="commit-branch-icon" />
                <code className="commit-hash">{commit.branch_name}</code>
                <span className="commit-time">{commit.timeAgo}</span>
              </div>

              <div className="commit-message-container">
                <span
                  className="commit-type"
                  style={{ color: getCommitTypeColor(commit.type) }}
                >
                  {commit.type}
                </span>
                <p className="commit-message">
                  {commit.decision.includes(':')
                    ? commit.decision.substring(commit.decision.indexOf(':') + 1).trim()
                    : commit.decision+' '}
                  {commit.mood}
                </p>
              </div>

              <div className="commit-hover-info">
                <div className="commit-details">
                  <span className="detail-label">Impact Score:</span>
                  <code className="detail-value">{commit.impact}</code>
                </div>
                <button
                  className="copy-impact-btn"
                  onClick={() => copyToClipboard(commit.impact)}
                >
                  {copiedHash === commit.branch_name ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Impact Score
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommitHistory;
