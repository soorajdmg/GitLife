// addDecision.js
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

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

    const docRef = await addDoc(collection(db, 'decisions'), decision);
    return { id: docRef.id, ...decision };
  } catch (error) {
    console.error("Error adding decision: ", error);
    throw error;
  }
};