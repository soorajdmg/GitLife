import React, { useState, useEffect } from 'react';
import { GitFork, Heart, GitBranch } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, writeBatch, doc } from 'firebase/firestore';
import './timeline.css';

const Timelines = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Create references and queries
      const branchesRef = collection(db, 'branches');
      const decisionsRef = collection(db, 'decisions');
      const branchesQuery = query(branchesRef);
      const decisionsQuery = query(decisionsRef);

      // Store branch and decision data
      let branchesMap = new Map();
      let decisionsMap = new Map();
      let dataLoaded = { branches: false, decisions: false };

      // Listen for branches changes
      const unsubscribeBranches = onSnapshot(branchesQuery, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          branchesMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        dataLoaded.branches = true;
        calculateStats();
      }, (error) => {
        console.error('Error fetching branches:', error);
        setError(error.message);
        setLoading(false);
      });

      // Listen for decisions changes
      const unsubscribeDecisions = onSnapshot(decisionsQuery, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          decisionsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        dataLoaded.decisions = true;
        calculateStats();
      }, (error) => {
        console.error('Error fetching decisions:', error);
        setError(error.message);
        setLoading(false);
      });

      // Calculate and update branch statistics
      const calculateStats = () => {
        if (!dataLoaded.branches || !dataLoaded.decisions) return;

        const updatedBranches = new Map();

        // Initialize branch stats
        branchesMap.forEach((branch, branchId) => {
          updatedBranches.set(branchId, {
            ...branch,
            commits: 0,
            impact: 0
          });
        });

        // Calculate totals from decisions
        decisionsMap.forEach((decision) => {
          if (decision.branch && updatedBranches.has(decision.branch)) {
            const branchStats = updatedBranches.get(decision.branch);
            branchStats.commits += 1;
            branchStats.impact += parseInt(decision.impact, 10) || 0;
          }
        });

        // Update Firestore with new stats
        const batch = writeBatch(db);
        updatedBranches.forEach((stats, branchId) => {
          const branchRef = doc(db, 'branches', branchId);
          batch.update(branchRef, {
            commits: stats.commits,
            impact: stats.impact
          });
        });

        batch.commit()
          .then(() => {
            setBranches(Array.from(updatedBranches.values()));
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error updating branch stats:', error);
            setError(error.message);
            setLoading(false);
          });
      };

      return () => {
        unsubscribeBranches();
        unsubscribeDecisions();
      };
    } catch (err) {
      console.error('Error setting up listeners:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="timelines-section">
        <div className="loading-state">Loading timelines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timelines-section">
        <div className="error-state">Error loading timelines: {error}</div>
      </div>
    );
  }

  return (
    <div className="timelines-section">
      <div className="timelines-header">
        <GitFork className="timeline-header-icon" />
        <h2 className="timelines-title">Active Timelines</h2>
      </div>

      <div className="timelines-container">
        {branches.length === 0 ? (
          <div className="no-timelines">No timelines found</div>
        ) : (
          branches.map((timeline) => (
            <div key={timeline.id} className="timeline-card">
              <div className="timeline-content">
                <div className="timeline-info">
                  <span className="timeline-name">{timeline.name}</span>
                  <p className="timeline-description">{timeline.description}</p>
                </div>

                <div className="timeline-stats">
                  <div className="stat-item likes">
                    <Heart className="stat-icon" />
                    <span className={`like-count ${timeline.impact >= 0 ? 'positive' : 'negative'}`}>
                      {timeline.impact > 0 ? `+${timeline.impact}` : timeline.impact}
                    </span>
                  </div>

                  <div className="stat-item commits">
                    <GitBranch className="stat-icon" />
                    <span className="commit-count">{timeline.commits}</span>
                  </div>

                  <div className={`status-badge ${timeline.status}`}>
                    {timeline.status}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Timelines;