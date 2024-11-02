import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';  // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyDaafclfe4AyjgKeewbU92tzofJKAh19_Q",
  authDomain: "gitlife20.firebaseapp.com",
  projectId: "gitlife20",
  storageBucket: "gitlife20.appspot.com",
  messagingSenderId: "1088651667438",
  appId: "1:1088651667438:web:75e9a26fd8809e6381d0ff",
  databaseURL: "https://gitlife20-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);  // Add this export