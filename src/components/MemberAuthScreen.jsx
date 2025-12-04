// src/components/MemberAuthScreen.jsx
import React, { useState } from "react";
import { Heart } from "lucide-react";
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

export default function MemberAuthScreen({ onLogin, onBack }) {
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

  const buildMemberUser = (uid, emailVal, data) => ({
    uid,
    email: emailVal,
    role: "member",
    managedBy: data.managedBy || "self",
    displayName: data.displayName || emailVal,
  });

  // LOGIN for members
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!auth || !db) {
        setError("App is not connected to database.");
        setLoading(false);
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const userEmail = cred.user.email || email;

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError("No member account found. Please sign up first.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const userObj = buildMemberUser(uid, userEmail, userData);
      onLogin(userObj);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  // SIGNUP for members
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!name.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }

      if (!auth || !db) {
        setError("App is not connected to database.");
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const userEmail = cred.user.email || email;

      const userDocRef = doc(db, "users", uid);
      const payload = {
        role: "member",
        managedBy, // "self" | "family"
        displayName: name.trim(),
        email: userEmail,
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, payload);

      const userObj = buildMemberUser(uid, userEmail, payload);
      onLogin(userObj);
    } catch (err) {
      console.error(err);
      setError(err.message || "Signup failed. Please try again.");
    }
    setLoading(false);
  };

  const isLogin = mode === "login";
  const tag =
    managedBy === "family" ? "FAMILY-MANAGED" : "SELF-MANAGED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/50 relative overflow-hidden">
        {/* top gradient bar */}
        <div className="absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />

        {/* header brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40">
            <Heart size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
              Humsafar Member
            </p>
            <h1 className="text-lg font-semibold text-slate-50">
              {isLogin ? "Member Login" : "Create Member Account"}
            </h1>
          </div>
        </div>

        {/* mode toggle */}
        <div className="flex mb-5 rounded-xl overflow-hidden border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={
              "w-1/2 py-2 text-xs font-semibold " +
              (isLogin
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-slate-100")
            }
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              resetForm();
            }}
            className={
              "w-1/2 py-2 text-xs font-semibold " +
              (!isLogin
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-slate-100")
            }
          >
            Signup
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form
          onSubmit={isLogin ? handleLogin : handleSignup}
          className="space-y-4"
        >
          {/* Name for signup */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
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
              className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
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
              className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Your password" : "Choose a strong password"}
              required
            />
          </div>

          {/* Managed by (signup only) */}
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
                <span className="font-semibold">{tag}</span>.
              </p>
            </div>
          )}

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
              ? "Login as Member"
              : "Sign Up & Continue"}
          </button>
        </form>

        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-[11px] text-slate-400 hover:text-slate-200 hover:underline"
        >
          ← Back to Website
        </button>
      </div>
    </div>
  );
}
