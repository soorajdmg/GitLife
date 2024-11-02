// src/components/CommitItem.jsx
import React from 'react';
import './CommitItem.css';

function CommitItem({ hash, time, message }) {
  return (
    <div className="commit-item">
      <div className="commit-hash">{hash}</div>
      <div className="commit-time">{time}</div>
      <div className="commit-message">{message}</div>
    </div>
  );
}

export default CommitItem;
