// src/App.jsx
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Navbar from './components/navbar';
import StatsCards from './components/StatsCards';
import TimelineGraph from './components/timelineGraph';
import Timeline from './components/timeline';
import CommitHistory from './components/commitHistory';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="app">
      <Navbar />
      <StatsCards />
      <TimelineGraph />
      <Timeline />
      <CommitHistory />
    </div>
  );
}

export default App;
