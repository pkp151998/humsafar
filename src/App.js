// src/App.js
import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

// Components
import PublicHome from "./components/PublicHome";
import LoginScreen from "./components/LoginScreen";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import GroupAdminDashboard from "./components/GroupAdminDashboard";
import MemberDashboard from "./components/MemberDashboard";
import MemberAuthScreen from "./components/MemberAuthScreen";

// ---------------------------------------------------------
// 🔵 Shared Profile Viewer Component (UI Only)
// ---------------------------------------------------------
const SharedProfileView = ({ profile, onBack }) => {
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <p className="font-semibold text-gray-800 mb-1">
            Profile not found
          </p>
          <p className="text-sm text-gray-500 mb-4">
            This profile number does not exist or is no longer public.
          </p>
          <button
            onClick={onBack}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back to Humsafar
          </button>
        </div>
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
          <p><strong>City:</strong> {profile.city || profile.pob || profile.address || "—"}</p>
          <p><strong>Address:</strong> {profile.address || "—"}</p>
          <p><strong>DOB:</strong> {profile.dob || "—"}</p>
          <p><strong>Manglik:</strong> {profile.manglik || "—"}</p>

          <p>
            <strong>Father:</strong> {profile.father || "—"}{" "}
            {profile.fatherOcc && <span className="text-xs text-gray-500">({profile.fatherOcc})</span>}
          </p>
          <p>
            <strong>Mother:</strong> {profile.mother || "—"}{" "}
            {profile.motherOcc && <span className="text-xs text-gray-500">({profile.motherOcc})</span>}
          </p>
          <p><strong>Siblings:</strong> {profile.siblings || "—"}</p>

          <p>
            <strong>Contact:</strong>{" "}
            <span className="font-mono text-xs">
              Contact details are shared only with authorized partners. Please
              connect via your group admin or the Humsafar team.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// 🛡️ ProtectedRoute – checks login + role
// ---------------------------------------------------------
const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// ---------------------------------------------------------
// 🔗 SharedProfileRoute - Fetches ONE profile by ID
// ---------------------------------------------------------
const SharedProfileRoute = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSingleProfile = async () => {
      if (!db) return;
      try {
        // Query specific profile by globalProfileNo
        const q = query(
          collection(db, "profiles"),
          where("globalProfileNo", "==", code)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (e) {
        console.error("Error fetching shared profile:", e);
      }
      setLoading(false);
    };

    fetchSingleProfile();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading profile details...</p>
      </div>
    );
  }

  return <SharedProfileView profile={profile} onBack={() => navigate("/")} />;
};

// ---------------------------------------------------------
// 🔵 MAIN APP (inner)
// ---------------------------------------------------------
function AppInner() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // NOTE: We removed the massive "fetch all profiles" useEffect here.
  // PublicHome now handles its own pagination.

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === "super") {
      navigate("/admin/dashboard");
    } else if (userData.role === "group") {
      navigate("/partner/dashboard");
    } else if (userData.role === "member") {
      navigate("/member/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <Routes>
      {/* PUBLIC HOME */}
      <Route
        path="/"
        element={
          <PublicHome
            onAdminLoginClick={() => navigate("/admin")}
            onMemberLoginClick={() => navigate("/member")}
          />
        }
      />

      {/* ADMIN LOGIN */}
      <Route
        path="/admin"
        element={<LoginScreen onLogin={handleLogin} onBack={() => navigate("/")} />}
      />

      {/* MEMBER LOGIN / SIGNUP */}
      <Route
        path="/member"
        element={<MemberAuthScreen onLogin={handleLogin} onBack={() => navigate("/")} />}
      />

      {/* DASHBOARDS */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute user={user} allowedRoles={["super"]}>
            <SuperAdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/dashboard"
        element={
          <ProtectedRoute user={user} allowedRoles={["group", "super"]}>
            <GroupAdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/dashboard"
        element={
          <ProtectedRoute user={user} allowedRoles={["member"]}>
            <MemberDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* PUBLIC SHARED PROFILE LINK */}
      <Route path="/p/:code" element={<SharedProfileRoute />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppInner />;
}