import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Replace these with your actual keys from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "trusathi-v2.firebaseapp.com",
  projectId: "trusathi-v2",
  storageBucket: "trusathi-v2.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// IMPORTANT: Specify the region 'asia-south1' to match the backend
export const functions = getFunctions(app, "asia-south1"); 

export default app;