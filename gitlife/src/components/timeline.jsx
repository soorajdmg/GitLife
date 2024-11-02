import React, { useState, useEffect } from 'react';
import { GitFork, Heart, GitBranch } from 'lucide-react';
import { db } from '../config/firebase';  // Import the Firestore db
import { collection, onSnapshot, query } from 'firebase/firestore';
import './timeline.css';

const Timelines = () => {
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Create a reference to the branches collection
      const branchesRef = collection(db, 'branches');
      const branchesQuery = query(branchesRef);

      // Set up real-time listener
      const unsubscribe = onSnapshot(branchesQuery, (snapshot) => {
        const timelinesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTimelines(timelinesList);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching timelines:', error);
        setError(error.message);
        setLoading(false);
      });

      // Cleanup listener on component unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up listener:', err);
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
        {timelines.length === 0 ? (
          <div className="no-timelines">No timelines found</div>
        ) : (
          timelines.map(timeline => (
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