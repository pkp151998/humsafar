import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, query, getDocs, orderBy } from "firebase/firestore";

import LoginScreen from "./components/LoginScreen";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import GroupAdminDashboard from "./components/GroupAdminDashboard";
import PublicHome from "./components/PublicHome";


// --- MAIN ROUTER ---
export default function App() {
  const [view, setView] = useState('public');
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!db) { 
        setLoading(false); 
        return; 
      }
      try {
        const q = query(collection(db, "profiles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        setProfiles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { 
        console.error(e); 
      }
      setLoading(false);
    };
    fetchProfiles();
  }, [view]);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'super') setView('superAdmin');
    else setView('groupAdmin');
  };

  const handleLogout = () => { 
    setUser(null); 
    setView('public');
   };

  return (
    <div>
      {view === 'public' && 
      <PublicHome 
      profiles={profiles} 
      onLoginClick={() => setView('login')} 
      loading={loading} 
      />}
      {view === 'login' && 
      <LoginScreen onLogin={handleLogin} onBack={() => setView('public')} />}
      {view === 'superAdmin' && <SuperAdminDashboard user={user} onLogout={handleLogout} />}
      {view === 'groupAdmin' && <GroupAdminDashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}
