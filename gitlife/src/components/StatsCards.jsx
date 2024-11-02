import React from 'react';
import { GitBranch, Heart, Coffee, Trophy } from 'lucide-react';
import './StatsCards.css';

const StatsCards = () => {
  const statsData = [
    {
      id: 1,
      icon: <GitBranch className="stats-icon yellow" />,
      label: "Decisions Made",
      value: "2",
      labelColor: "#fbbf24" // Yellow color for the label
    },
    {
      id: 2,
      icon: <Heart className="stats-icon red" />,
      label: "Regrets",
      value: "∞",
      labelColor: "#f87171" // Red color for the label
    },
    {
      id: 3,
      icon: <Coffee className="stats-icon blue" />,
      label: "Caffeine Commits",
      value: "3",
      labelColor: "#60a5fa" // Blue color for the label
    },
    {
      id: 4,
      icon: <Trophy className="stats-icon purple" />,
      label: "Impact Score",
      value: "404",
      labelColor: "#a78bfa" // Purple color for the label
    }
  ];



  return (
    <div className="stats-container">
      {statsData.map(stat => (
        <div key={stat.id} className="stats-card">
          <div className="stats-header">
            {stat.icon}
            <span className="stats-label">{stat.label}</span>
          </div>
          <div className="stats-value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;