import React, { useEffect, useState } from "react";

import PublicHome from "./components/PublicHome";
import LoginScreen from "./components/LoginScreen";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import GroupAdminDashboard from "./components/GroupAdminDashboard";

import {
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";

import { db } from "./firebase";


// ---------------------------------------------------------
// 🔵 Shared Profile Viewer Component
// ---------------------------------------------------------
const SharedProfileView = ({ profile, onBack }) => {
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <button
        onClick={onBack}
        className="self-start mb-4 text-sm text-indigo-600 hover:underline"
      >
        ← Back to Home
      </button>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {profile.name}
        </h1>

        {profile.globalProfileNo && (
          <p className="text-xs text-gray-500 mb-2">
            Profile No: {profile.globalProfileNo}
          </p>
        )}

        <p className="text-sm text-gray-500 mb-4">
          {profile.age && `${profile.age} yrs`}{" "}
          {profile.gender && `• ${profile.gender}`}{" "}
          {profile.height && `• ${profile.height}`}
        </p>

        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Education:</strong> {profile.education || "—"}</p>
          <p><strong>Profession:</strong> {profile.profession || "—"}</p>
          <p><strong>Income:</strong> {profile.income || "—"}</p>
          <p>
            <strong>City:</strong>{" "}
            {profile.city || profile.pob || profile.address || "—"}
          </p>
          <p><strong>Address:</strong> {profile.address || "—"}</p>
          <p><strong>DOB:</strong> {profile.dob || "—"}</p>
          <p><strong>Manglik:</strong> {profile.manglik || "—"}</p>

          <p>
            <strong>Father:</strong> {profile.father || "—"}{" "}
            {profile.fatherOcc && (
              <span className="text-xs text-gray-500">
                ({profile.fatherOcc})
              </span>
            )}
          </p>

          <p>
            <strong>Mother:</strong> {profile.mother || "—"}{" "}
            {profile.motherOcc && (
              <span className="text-xs text-gray-500">
                ({profile.motherOcc})
              </span>
            )}
          </p>

          <p><strong>Siblings:</strong> {profile.siblings || "—"}</p>

          <p>
  <strong>Contact:</strong>{" "}
  <span className="font-mono">
    Contact details are shared only with authorized partners. 
    Please connect via your group admin or the Humsafar team.
  </span>
</p>
        </div>
      </div>
    </div>
  );
};



// ---------------------------------------------------------
// 🔵 MAIN APP
// ---------------------------------------------------------
export default function App() {

  const [view, setView] = useState("public");
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // For shared profile link
  const [sharedProfileCode, setSharedProfileCode] = useState(null);
  const [sharedProfile, setSharedProfile] = useState(null);


  // ---------------------------------------------------------
  // 🔴 1. On First Load → Check if ?profile=HS-00023 exists
  // ---------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("profile");

    if (code) {
      setSharedProfileCode(code);
      setView("sharedProfile");
    }
  }, []);



  // ---------------------------------------------------------
  // 🔵 2. Fetch all profiles normally
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "profiles"),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        setProfiles(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    };

    load();
  }, [view]);



  // ---------------------------------------------------------
  // 🔵 3. After profiles load + shared code available → find it
  // ---------------------------------------------------------
  useEffect(() => {
    if (sharedProfileCode && profiles.length > 0) {
      const found = profiles.find(
        (p) => p.globalProfileNo === sharedProfileCode
      );
      setSharedProfile(found || null);
    }
  }, [sharedProfileCode, profiles]);



  // ---------------------------------------------------------
  // 🔵 LOGIN HANDLING
  // ---------------------------------------------------------
  const handleLogin = (userData) => {
    setUser(userData);

    if (userData.role === "super") setView("superAdmin");
    else setView("groupAdmin");
  };

  const handleLogout = () => {
    setUser(null);
    setView("public");
  };



  // ---------------------------------------------------------
  // 🔵 RENDER
  // ---------------------------------------------------------
  return (
    <>
      {/* PUBLIC HOME */}
      {view === "public" && (
        <PublicHome
          profiles={profiles}
          onLoginClick={() => setView("login")}
          loading={loading}
        />
      )}

      {/* LOGIN SCREEN */}
      {view === "login" && (
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setView("public")}
        />
      )}

      {/* SUPER ADMIN */}
      {view === "superAdmin" && (
        <SuperAdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* GROUP ADMIN */}
      {view === "groupAdmin" && (
        <GroupAdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* SHARED PROFILE VIEW */}
      {view === "sharedProfile" && (
        <SharedProfileView
          profile={sharedProfile}
          onBack={() => {
            // Remove ?profile=... from URL
            const url = new URL(window.location.href);
            url.searchParams.delete("profile");
            window.history.replaceState(null, "", url.toString());

            // Reset
            setSharedProfile(null);
            setSharedProfileCode(null);

            setView("public");
          }}
        />
      )}
    </>
  );
}
