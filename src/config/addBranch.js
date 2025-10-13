import { api } from './api';

export const addBranch = async (branchData) => {
  try {
    // Create a standardized branch object with all required fields
    const branch = {
      commits: parseInt(branchData.commits) || 0,
      impact: parseFloat(branchData.impact) || 0,
      name: branchData.branch_name.trim(),
      status: branchData.status || "catastrophic",
      type: branchData.branch_type || "main-timeline",
      timestamp: branchData.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!branch.name) {
      throw new Error("Branch name is required");
    }

    if (!["main-timeline", "alternative", "what-if"].includes(branch.type)) {
      throw new Error("Invalid branch type");
    }

    // Add the branch via API
    const result = await api.createBranch(branch);

    // Return the created branch with its ID
    return result;
  } catch (error) {
    console.error("Error adding branch: ", error);
    throw error;
  }
};
