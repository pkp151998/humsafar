import React, { useState } from "react";
import { Lock } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";


const LoginScreen = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Check Super Admin
    if (username === 'master' && password === 'soulbind') {
      onLogin({ role: 'super', username: 'Super Admin', groupName: 'Humsafar HQ' });
      setLoading(false);
      return;
    }

    // 2. Check Group Admins
    if (!db) { setError("Database not connected"); setLoading(false); return; }

    try {
      const q = query(collection(db, "admins"), where("username", "==", username));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        if (userData.password === password) {
          onLogin({ role: 'group', ...userData, id: snapshot.docs[0].id });
        } else {
          setError("Incorrect Password");
        }
      } else {
        setError("User not found");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    }
    setLoading(false);
  };

  return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-900 rounded-full flex items-center justify-center text-white mx-auto mb-3">
              <Lock size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Partner Login</h2>
            <p className="text-sm text-gray-500">Sign in to manage your group</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
            <button disabled={loading} className="w-full bg-indigo-900 text-white font-bold py-3 rounded-xl hover:bg-indigo-800 disabled:bg-gray-400">
              {loading ? "Verifying..." : "Login"}
            </button>
          </form>
          <button onClick={onBack} className="w-full text-center text-sm text-gray-500 mt-4 hover:underline">Back to Website</button>
        </div>
      </div>
    );
  };

  export default LoginScreen;
