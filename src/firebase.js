import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Replace these with your actual keys from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB5gD4mjL3g6jASaDTSXauil1Dm7zHVn7c",
  authDomain: "myhumsafar-5b72d.firebaseapp.com",
  projectId: "myhumsafar-5b72d",
  storageBucket: "myhumsafar-5b72d.firebasestorage.app",
  messagingSenderId: "455231316018",
  appId: "1:455231316018:web:3296dde5d54c7ac0eedc2b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// IMPORTANT: Specify the region 'asia-south1' to match the backend
export const functions = getFunctions(app, "asia-south1"); 

export default app;