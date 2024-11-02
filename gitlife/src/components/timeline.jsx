import React from 'react';
import { GitFork, Heart, GitBranch } from 'lucide-react';
import './timeline.css';

const timelines = () => {
  const timelinesData = [
    {
      id: 1,
      name: "main-timeline",
      description: "The boring path where I actually did my homework",
      likes: 42,
      commits: 1562,
      status: "stable-ish"
    },
    {
      id: 2,
      name: "what-if/dropout-startup",
      description: "Timeline where I become the next failed startup founder",
      likes: -27,
      commits: 83,
      status: "catastrophic"
    }
  ];

  return (
    <div className="timelines-section">
      <div className="timelines-header">
        <GitFork className="timeline-header-icon" />
        <h2 className="timelines-title">Active Timelines</h2>
      </div>

      <div className="timelines-container">
        {timelinesData.map(timeline => (
          <div key={timeline.id} className="timeline-card">
            <div className="timeline-content">
              <div className="timeline-info">
                <span className="timeline-name">{timeline.name}</span>
                <p className="timeline-description">{timeline.description}</p>
              </div>

              <div className="timeline-stats">
                <div className="stat-item likes">
                  <Heart className="stat-icon" />
                  <span className={`like-count ${timeline.likes >= 0 ? 'positive' : 'negative'}`}>
                    {timeline.likes > 0 ? `+${timeline.likes}` : timeline.likes}
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
        ))}
      </div>
    </div>
  );
};

export default timelines;