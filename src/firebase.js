// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5gD4mjL3g6jASaDTSXauil1Dm7zHVn7c",
  authDomain: "myhumsafar-5b72d.firebaseapp.com",
  projectId: "myhumsafar-5b72d",
  storageBucket: "myhumsafar-5b72d.firebasestorage.app",
  messagingSenderId: "455231316018",
  appId: "1:455231316018:web:3296dde5d54c7ac0eedc2b",
};

let db;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

export { db };
