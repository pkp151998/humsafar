import React, { useState } from "react";
import { Lock } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase";

const LoginScreen = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!auth || !db) {
        setError("App is not connected to database.");
        setLoading(false);
        return;
      }

      // 1) Firebase Auth login
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2) Fetch admin metadata (role, groupName) from Firestore
      const adminRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        setError("No admin profile found for this account.");
        setLoading(false);
        return;
      }

      const adminData = adminSnap.data();
      const role = adminData.role || "group";

      onLogin({
        role,
        uid,
        email: adminData.email || email,
        groupName: adminData.groupName || "Humsafar",
        ...adminData,
      });
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else {
        setError("Login failed: " + err.message);
      }
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
          <h2 className="text-2xl font-bold text-gray-800">
            TruSathi Partner Login
          </h2>
          <p className="text-sm text-gray-500">
            Sign in to manage your TruSathi group profiles
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500"
            placeholder="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-indigo-900 text-white font-bold py-3 rounded-xl hover:bg-indigo-800 disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <button
          onClick={onBack}
          className="w-full text-center text-sm text-gray-500 mt-4 hover:underline"
        >
          Back to TruSathi
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
