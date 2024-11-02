// src/App.jsx
import React from 'react';
import Navbar from './components/navbar';
import StatsCards from './components/StatsCards';
import TimelineGraph from './components/timelineGraph';
import Timeline from './components/Timeline';
import CommitHistory from './components/commitHistory';
import './App.css';

function App() {
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
