import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import './createBranch.css';
import { addBranch } from '../config/addBranch';

const CreateBranch = () => {
    const [branchData, setBranchData] = useState({
        name: '',
        type: 'what-if',
        commits: 0,
        impact: 0,
        status: 'catastrophic',
        timestamp: new Date().toISOString()
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBranchData(prev => ({
            ...prev,
            [name]: value,
            timestamp: new Date().toISOString()
        }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!branchData.name.trim()) {
            setError('Branch name cannot be empty.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const formattedData = {
                ...branchData,
                commits: parseInt(branchData.commits),
                impact: parseFloat(branchData.impact),
                timestamp: new Date().toISOString()
            };

            const newBranch = await addBranch(formattedData);
            console.log('Branch created successfully:', newBranch);
            setSuccess('Branch created successfully!');
            
            // Reset form
            setBranchData({
                name: '',
                type: 'what-if',
                commits: 0,
                impact: 0,
                status: 'catastrophic',
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            setError('Failed to create branch. Please try again.');
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Branch</h2>
            
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label 
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Branch Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter branch name"
                        value={branchData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                
                <div className="space-y-2">
                    <label 
                        htmlFor="type"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Branch Type *
                    </label>
                    <select
                        id="type"
                        name="type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={branchData.type}
                        onChange={handleInputChange}
                    >
                        <option value="main-timeline">Main Timeline</option>
                        <option value="alternative">Alternative</option>
                        <option value="what-if">What-If</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label 
                        htmlFor="commits"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Commits
                    </label>
                    <input
                        type="number"
                        id="commits"
                        name="commits"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={branchData.commits}
                        onChange={handleInputChange}
                        min="0"
                    />
                </div>

                <div className="space-y-2">
                    <label 
                        htmlFor="impact"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Impact
                    </label>
                    <input
                        type="number"
                        id="impact"
                        name="impact"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={branchData.impact}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                    />
                </div>

                <div className="space-y-2">
                    <label 
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={branchData.status}
                        onChange={handleInputChange}
                    >
                        <option value="catastrophic">Catastrophic</option>
                        <option value="stable">Stable</option>
                        <option value="optimal">Optimal</option>
                    </select>
                </div>

                <button 
                    type="submit" 
                    className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create Branch'}
                </button>
            </form>
        </div>
    );
};

export default CreateBranch;