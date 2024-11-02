import React, { useState } from 'react';
import './createBranch.css';

const CreateBranch = ({ onCreateBranch }) => {
    const [branchName, setBranchName] = useState('');
    const [branchDescription, setBranchDescription] = useState('');

    const handleCreateBranch = (e) => {
        e.preventDefault();
        if (branchName.trim()) {
            onCreateBranch({ name: branchName, description: branchDescription });
            setBranchName('');
            setBranchDescription('');
        } else {
            alert('Branch name cannot be empty.');
        }
    };

    return (
        <div className="create-branch-form">
            <h2 className="form-title">Create New Branch</h2>
            <form onSubmit={handleCreateBranch}>
                <div className="form-group">
                    <label htmlFor="branchName">Branch Name</label>
                    <input
                        type="text"
                        id="branchName"
                        className="input-field"
                        placeholder="Enter branch name"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="branchDescription">Branch Description (optional)</label>
                    <textarea
                        id="branchDescription"
                        className="input-field"
                        placeholder="Enter a description for this branch"
                        value={branchDescription}
                        onChange={(e) => setBranchDescription(e.target.value)}
                    ></textarea>
                </div>

                <button type="submit" className="create-branch-button">
                    Create Branch
                </button>
            </form>
        </div>
    );
};

export default CreateBranch;
