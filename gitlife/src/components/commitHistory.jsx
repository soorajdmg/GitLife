import React, { useState, useEffect } from 'react';
import { Clock, GitBranch, Copy, Check } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import './commitHistory.css';

const CommitHistory = () => {
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
    try {
      const decisionsRef = collection(db, 'decisions');
      const decisionsQuery = query(
        decisionsRef,
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(decisionsQuery, (snapshot) => {
        const commitsList = snapshot.docs.map(doc => {
          const data = doc.data();
          const date = convertTimestamp(data.timestamp);
          
          return {
            id: doc.id,
            hash: doc.id.substring(0, 7),
            timeAgo: date ? calculateTimeAgo(date) : 'unknown time ago',
            message: data.message || 'No message provided',
            type: data.type || 'default',
            fullHash: doc.id,
            timestamp: date,
            branch_name: data.branch_name || doc.id.substring(0, 7),
            decision: data.decision || data.message || 'No description available'
          };
        });
        setCommits(commitsList);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching commits:', err);
        setError(err.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

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
      merge: '#60a5fa',
      refactor: '#a78bfa',
      default: '#9ca3af'
    };
    return types[type.split('(')[0]] || types.default;
  };

  const copyToClipboard = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
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
                    : commit.decision}
                </p>
              </div>
              
              <div className="commit-hover-info">
                <div className="commit-details">
                  <span className="detail-label">Branch name:</span>
                  <code className="detail-value">{commit.branch_name}</code>
                </div>
                <button 
                  className="copy-hash-btn"
                  onClick={() => copyToClipboard(commit.branch_name)}
                >
                  {copiedHash === commit.branch_name ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Hash
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