import React, { useState, useEffect } from 'react';
import { GitFork, Heart, GitBranch } from 'lucide-react';
import { api } from '../config/api';
import './timeline.css';

const Timelines = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch branches and decisions
        const [branchesData, decisionsData] = await Promise.all([
          api.getBranches(),
          api.getDecisions()
        ]);

        // Create a map to calculate stats
        const branchStatsMap = new Map();

        // Initialize branch stats
        branchesData.forEach((branch) => {
          branchStatsMap.set(branch.name, {
            ...branch,
            commits: 0,
            impact: 0
          });
        });

        // Calculate totals from decisions
        decisionsData.forEach((decision) => {
          const branchName = decision.branch_name || decision.branch;
          if (branchName && branchStatsMap.has(branchName)) {
            const branchStats = branchStatsMap.get(branchName);
            branchStats.commits += 1;
            branchStats.impact += parseInt(decision.impact, 10) || 0;
          }
        });

        // Update branches with calculated stats
        const updatedBranches = await Promise.all(
          Array.from(branchStatsMap.values()).map(async (branch) => {
            try {
              await api.updateBranch(branch.id, {
                commits: branch.commits,
                impact: branch.impact
              });
              return branch;
            } catch (error) {
              console.error(`Error updating branch ${branch.id}:`, error);
              return branch;
            }
          })
        );

        setBranches(updatedBranches);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();

    // Poll for updates every 5 seconds (replaces real-time listeners)
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
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
