// addDecision.js
import { api } from './api';

export const addDecision = async (decisionFormData) => {
  try {
    // Transform the form data to match your database structure
    const decision = {
      branch_name: decisionFormData.branch,
      impact: Number(decisionFormData.impact),
      decision: decisionFormData.decision,
      timestamp: new Date().toISOString(),
      type: decisionFormData.commitType,
      mood: decisionFormData.mood
    };

    const result = await api.createDecision(decision);
    return result;
  } catch (error) {
    console.error("Error adding decision: ", error);
    throw error;
  }
};
