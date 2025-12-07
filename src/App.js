import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import PublicHome from "./components/PublicHome";
import LoginScreen from "./components/LoginScreen";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import GroupAdminDashboard from "./components/GroupAdminDashboard";
import MemberDashboard from "./components/MemberDashboard";
import MemberAuthScreen from "./components/MemberAuthScreen";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";


// ---------------------------------------------------------
// 🔵 Shared Profile Viewer Component
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
          <p>
            <strong>Education:</strong> {profile.education || "—"}
          </p>
          <p>
            <strong>Profession:</strong> {profile.profession || "—"}
          </p>
          <p>
            <strong>Income:</strong> {profile.income || "—"}
          </p>
          <p>
            <strong>City:</strong>{" "}
            {profile.city || profile.pob || profile.address || "—"}
          </p>
          <p>
            <strong>Address:</strong> {profile.address || "—"}
          </p>
          <p>
            <strong>DOB:</strong> {profile.dob || "—"}
          </p>
          <p>
            <strong>Manglik:</strong> {profile.manglik || "—"}
          </p>

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

          <p>
            <strong>Siblings:</strong> {profile.siblings || "—"}
          </p>

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
  if (!user) {
    // not logged in → send to home
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // logged in but wrong role
    return <Navigate to="/" replace />;
  }

  return children;
};


// ---------------------------------------------------------
// 🔗 Route wrapper for /p/:code
// ---------------------------------------------------------
const SharedProfileRoute = ({ profiles, loading }) => {
  const { code } = useParams();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading profile…</p>
      </div>
    );
  }

  const profile = profiles.find((p) => p.globalProfileNo === code);

  return (
    <SharedProfileView
      profile={profile}
      onBack={() => navigate("/")}
    />
  );
};


// ---------------------------------------------------------
// 🔵 MAIN APP (inner, uses router hooks)
// ---------------------------------------------------------
function AppInner() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const navigate = useNavigate();

  // Fetch all public profiles on first load
  useEffect(() => {
    const load = async () => {
      if (!db) {
        setLoadingProfiles(false);
        return;
      }

      try {
        const q = query(
          collection(db, "profiles"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }

      setLoadingProfiles(false);
    };

    load();
  }, []);

  // LOGIN HANDLER – decides where to send user
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
            profiles={profiles}
            loading={loadingProfiles}
            onAdminLoginClick={() => navigate("/admin")}
            onMemberLoginClick={() => navigate("/member")}
          />
        }
      />

      {/* ADMIN LOGIN */}
      <Route
        path="/admin"
        element={
          <LoginScreen
            onLogin={handleLogin}
            onBack={() => navigate("/")}
          />
        }
      />

      {/* MEMBER LOGIN / SIGNUP */}
      <Route
        path="/member"
        element={
          <MemberAuthScreen
            onLogin={handleLogin}
            onBack={() => navigate("/")}
          />
        }
      />

      {/* SUPER ADMIN DASHBOARD */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute user={user} allowedRoles={["super"]}>
            <SuperAdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* GROUP / PARTNER DASHBOARD */}
      <Route
        path="/partner/dashboard"
        element={
          <ProtectedRoute user={user} allowedRoles={["group", "super"]}>
            <GroupAdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* MEMBER DASHBOARD */}
      <Route
        path="/member/dashboard"
        element={
          <ProtectedRoute user={user} allowedRoles={["member"]}>
            <MemberDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* PUBLIC SHARED PROFILE – /p/HS-00023 */}
      <Route
        path="/p/:code"
        element={
          <SharedProfileRoute
            profiles={profiles}
            loading={loadingProfiles}
          />
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


// ---------------------------------------------------------
// Outer App (router is already in index.js)
// ---------------------------------------------------------
export default function App() {
  return <AppInner />;
}
