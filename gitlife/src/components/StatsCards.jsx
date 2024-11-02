import React, { useState, useEffect } from 'react';
import { GitBranch, Heart, Trophy, GitCommitHorizontal } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import './StatsCards.css';

const StatsCards = () => {
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
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Fetch stats document
        const statsRef = collection(db, 'stats');
        const statsSnapshot = await getDocs(statsRef);
        const statsDoc = statsSnapshot.docs[0]?.data();

        // Fetch total branches
        const branchesRef = collection(db, 'branches');
        const branchesSnapshot = await getDocs(branchesRef);
        const totalBranches = branchesSnapshot.size;

        setStatsData(prevStats => prevStats.map(stat => {
          switch (stat.id) {
            case 1: // Decisions Made
              return { ...stat, value: (statsDoc?.totalDecisions || 0).toString() };
            case 3: // Branches created
              return { ...stat, value: totalBranches.toString() };
            case 4: // Impact Score
              return { ...stat, value: (statsDoc?.impactScore || 0).toString() };
            default:
              return stat;
          }
        }));
      } catch (err) {
        console.error('Error processing stats data:', err);
        setError('Error loading stats data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Set up a listener for real-time updates (optional)
    // const unsubscribe = onSnapshot(collection(db, 'stats'), (snapshot) => {
    //   fetchStats();
    // });

    // return () => unsubscribe();
  }, []);

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