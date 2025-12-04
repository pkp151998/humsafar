// src/components/LoginScreen.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [managedBy, setManagedBy] = useState("self"); // "self" | "family"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setManagedBy("self");
    setError("");
  };

  // 🔐 COMMON: create user object for React state
  const buildAdminUser = (uid, email, adminData) => ({
    uid,
    email,
    role: adminData.role || "group",
    groupName: adminData.groupName || "",
    displayName: adminData.displayName || email,
  });

  const buildMemberUser = (uid, email, userData) => ({
    uid,
    email,
    role: "member",
    managedBy: userData.managedBy || "self",
    displayName: userData.displayName || email,
  });

  // 🟦 LOGIN (Admin or Member)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const userEmail = cred.user.email || email;

      // 1️⃣ Try admin collection
      const adminRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        const adminData = adminSnap.data();
        const userObj = buildAdminUser(uid, userEmail, adminData);
        onLogin(userObj);
        setLoading(false);
        return;
      }

      // 2️⃣ Try normal user collection
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userObj = buildMemberUser(uid, userEmail, userData);
        onLogin(userObj);
        setLoading(false);
        return;
      }

      // 3️⃣ No admin, no member
      setError("No account found. If you are a new user, please sign up.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  // 🟩 SIGNUP (Member only)
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!name.trim()) {
        setError("Please enter your name.");
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const userEmail = cred.user.email || email;

      const userDocRef = doc(db, "users", uid);

      await setDoc(userDocRef, {
        role: "member",
        managedBy, // "self" | "family"
        displayName: name.trim(),
        email: userEmail,
        createdAt: serverTimestamp(),
      });

      const userObj = buildMemberUser(uid, userEmail, {
        managedBy,
        displayName: name.trim(),
      });

      onLogin(userObj);
    } catch (err) {
      console.error(err);
      setError(err.message || "Signup failed. Please try again.");
    }
    setLoading(false);
  };

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/50">
        {/* Mode toggle */}
        <div className="flex mb-6 rounded-xl overflow-hidden border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={
              "w-1/2 py-2.5 text-sm font-semibold " +
              (isLogin
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-slate-100")
            }
          >
            Admin / Member Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              resetForm();
            }}
            className={
              "w-1/2 py-2.5 text-sm font-semibold " +
              (!isLogin
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-slate-100")
            }
          >
            New Member Signup
          </button>
        </div>

        {/* Heading */}
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold mb-1">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
          <h1 className="text-xl font-semibold text-slate-50 mb-1">
            {isLogin
              ? "Sign in to Humsafar Admin / Member"
              : "Join Humsafar as a member"}
          </h1>
          {isLogin ? (
            <p className="text-xs text-slate-400">
              Use your existing <span className="font-semibold">Admin</span> or{" "}
              <span className="font-semibold">Member</span> email & password.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Create a{" "}
              <span className="font-semibold">self-managed or family-managed</span>{" "}
              profile account.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {/* Name (signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Your password" : "Choose a strong password"}
              required
            />
          </div>

          {/* ManagedBy (signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Who will manage this profile?
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setManagedBy("self")}
                  className={
                    "flex-1 px-3 py-2 rounded-lg border " +
                    (managedBy === "self"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-700 bg-slate-900 text-slate-300")
                  }
                >
                  Self Managed
                </button>
                <button
                  type="button"
                  onClick={() => setManagedBy("family")}
                  className={
                    "flex-1 px-3 py-2 rounded-lg border " +
                    (managedBy === "family"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-700 bg-slate-900 text-slate-300")
                  }
                >
                  Family Managed
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                We’ll tag your profiles as{" "}
                <span className="font-semibold">
                  {managedBy === "self" ? "SELF-MANAGED" : "FAMILY-MANAGED"}
                </span>
                .
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? isLogin
                ? "Signing in…"
                : "Creating account…"
              : isLogin
              ? "Sign In"
              : "Sign Up as Member"}
          </button>
        </form>

        {/* Helper text */}
        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Admin accounts are created by the Super Admin. Normal users should{" "}
          {!isLogin ? "use the signup above." : "use the signup tab to create a member account."}
        </p>
      </div>
    </div>
  );
}
