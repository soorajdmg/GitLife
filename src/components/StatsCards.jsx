import React, { useState, useEffect } from 'react';
import { GitBranch, Heart, Trophy, GitCommitHorizontal } from 'lucide-react';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import './StatsCards.css';

const StatsCards = () => {
  const { refreshTrigger } = useDataRefresh();
  const [statsData, setStatsData] = useState([
    {
      id: 1,
      icon: <GitCommitHorizontal className="stats-icon yellow" />,
      label: "Decisions Made",
      value: "0",
      labelColor: "#fbbf24"
    },
    {
      id: 2,
      icon: <Heart className="stats-icon red" />,
      label: "Regrets",
      value: "∞",
      labelColor: "#f87171"
    },
    {
      id: 3,
      icon: <GitBranch className="stats-icon blue" />,
      label: "Branches created",
      value: "0",
      labelColor: "#60a5fa"
    },
    {
      id: 4,
      icon: <Trophy className="stats-icon purple" />,
      label: "Impact Score",
      value: "0",
      labelColor: "#a78bfa"
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isFirstFetch = true;

    const fetchStats = async () => {
      try {
        if (isFirstFetch) setIsLoading(true);

        // Fetch stats, decisions count, and branches count in parallel
        const [stats, decisionCount, branches] = await Promise.all([
          api.getStats(),
          api.getDecisionCount(),
          api.getBranches()
        ]);

        setStatsData(prevStats => prevStats.map(stat => {
          switch (stat.id) {
            case 1: // Decisions Made
              return { ...stat, value: decisionCount.toString() };
            case 3: // Branches created
              return { ...stat, value: branches.length.toString() };
            case 4: // Impact Score
              return { ...stat, value: (stats?.impacts || 0).toString() };
            default:
              return stat;
          }
        }));
      } catch (err) {
        console.error('Error processing stats data:', err);
        setError('Error loading stats data');
      } finally {
        if (isFirstFetch) {
          setIsLoading(false);
          isFirstFetch = false;
        }
      }
    };

    fetchStats();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  if (isLoading) {
    return (
      <div className="stats-container">
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="text-red-500">Error loading stats: {error}</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      {statsData.map(stat => (
        <div key={stat.id} className="stats-card">
          <div className="stats-header">
            {stat.icon}
            <span className="stats-label" style={{ color: stat.labelColor }}>
              {stat.label}
            </span>
          </div>
          <div className="stats-value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
