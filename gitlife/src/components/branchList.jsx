import React from 'react';
import './branchList.css';

const BranchList = () => {
  const branches = ['main', 'career-path', 'personal-growth']; // Example branches

  return (
    <div className="branch-list">
      <h3>Branches</h3>
      <ul>
        {branches.map((branch, index) => (
          <li key={index}>{branch}</li>
        ))}
      </ul>
    </div>
  );
};

export default BranchList;
