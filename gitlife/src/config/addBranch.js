// addBranch.js
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const addBranch = async (branchData) => {
  try {
    const branch = {
      commits: 0,
      impact: 0,
      name: branchData.branch_name,
      status: "catastrophic",
      type: branchData.branch_type
    };

    const docRef = await addDoc(collection(db, 'branches'), branch);
    return { id: docRef.id, ...branch };
  } catch (error) {
    console.error("Error adding branch: ", error);
    throw error;
  }
};