// src/components/MemberDashboard.jsx
import React, { useEffect, useState } from "react";
import { LogOut, User, Shield, HeartHandshake, FileText } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { parseBiodataHybrid } from "../utils/parseBiodata";

// Basic sanitization (same idea as in GroupAdminDashboard)
const sanitizeProfile = (data) => {
  const cleaned = {};
  Object.keys(data || {}).forEach((key) => {
    const value = data[key];
    if (typeof value === "string") {
      const noTags = value.replace(/<[^>]*>/g, "").trim();
      cleaned[key] = noTags.slice(0, 500);
    } else {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export default function MemberDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview"); // "overview" | "profile" | "account";

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const [rawText, setRawText] = useState("");
  const [profileDocId, setProfileDocId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const tag =
    user.managedBy === "family" ? "FAMILY-MANAGED" : "SELF-MANAGED";

  // Load existing member-owned profile from /profiles
  useEffect(() => {
    const loadProfile = async () => {
      if (!db || !user?.uid) {
        setLoadingProfile(false);
        return;
      }

      try {
        const q = query(
          collection(db, "profiles"),
          where("memberUid", "==", user.uid)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setProfileDocId(docSnap.id);
          setProfileData(docSnap.data());
        }
      } catch (e) {
        console.error(e);
      }
      setLoadingProfile(false);
    };

    loadProfile();
  }, [user?.uid]);

  // Parse WhatsApp biodata text
  const handleParse = () => {
    setStatus("");
    if (!rawText.trim()) return;
    const parsed = parseBiodataHybrid(rawText);
    setProfileData((prev) => ({
      ...(prev || {}),
      ...parsed,
    }));
    setTab("profile");
  };

  // Save or update profile in /profiles
  const handleSaveProfile = async () => {
    if (!db || !user?.uid) {
      setStatus("App is not connected to database.");
      return;
    }

    if (!profileData || !profileData.name) {
      setStatus("Please ensure at least Name is present before saving.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const cleaned = sanitizeProfile(profileData);
      const payload = {
        ...cleaned,
        memberUid: user.uid,
        source: "member",
        updatedAt: serverTimestamp(),
      };

      if (!profileDocId) {
        // CREATE
        payload.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, "profiles"), payload);
        setProfileDocId(docRef.id);
        setStatus("Profile created successfully.");
      } else {
        // UPDATE
        const ref = doc(db, "profiles", profileDocId);
        await updateDoc(ref, payload);
        setStatus("Profile updated successfully.");
      }
    } catch (e) {
      console.error(e);
      setStatus(e.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40">
              <HeartHandshake size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Humsafar Member
              </p>
              <h1 className="text-sm md:text-base font-semibold text-slate-100">
                Welcome, {user.displayName || user.email}
              </h1>
              <p className="text-[11px] text-slate-400">
                Profile type: <span className="font-semibold">{tag}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          {/* TABS */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setTab("overview")}
                className={
                  "px-3 py-1.5 rounded-full border " +
                  (tab === "overview"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800")
                }
              >
                Overview
              </button>
              <button
                onClick={() => setTab("profile")}
                className={
                  "px-3 py-1.5 rounded-full border " +
                  (tab === "profile"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800")
                }
              >
                My Profile
              </button>
              <button
                onClick={() => setTab("account")}
                className={
                  "px-3 py-1.5 rounded-full border " +
                  (tab === "account"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800")
                }
              >
                Account & Security
              </button>
            </div>
          </div>

          {/* TAB CONTENTS */}
          {tab === "overview" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-50 mb-1">
                Your Matrimony Space
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                You&apos;re logged in as a Humsafar member. You can paste your
                biodata text, auto-fill details, and save your profile for
                admins to review.
              </p>

              <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-300">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Account Email
                  </p>
                  <p className="font-mono text-slate-100">{user.email}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Managed By
                  </p>
                  <p className="font-semibold">
                    {user.managedBy === "family"
                      ? "Family / Parents"
                      : "Self"}
                  </p>
                </div>
              </div>

              <div className="mt-5 text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                Tips:
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>
                    Keep your biodata honest and up to date (education, job,
                    family).
                  </li>
                  <li>
                    Contact details are visible only to admins and trusted
                    partners, not to general public.
                  </li>
                  <li>
                    If your parents are managing, they can also log in with this
                    member account.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-50 mb-1 flex items-center gap-2">
                <FileText size={16} />
                My Biodata
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Paste your WhatsApp biodata text on the left, we&apos;ll try to
                auto-fill details. You can then save or update your profile.
              </p>

              {loadingProfile ? (
                <p className="text-xs text-slate-400">Loading your profile…</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* LEFT: Paste text + parse */}
                  <div className="space-y-2 text-xs">
                    <label className="block text-[11px] font-medium text-slate-300">
                      Paste your biodata text
                    </label>
                    <textarea
                      className="w-full h-48 bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste your full biodata from WhatsApp here..."
                    />
                    <button
                      type="button"
                      onClick={handleParse}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:bg-slate-600"
                      disabled={!rawText.trim()}
                    >
                      Auto-fill from text
                    </button>

                    <p className="text-[10px] text-slate-500 mt-1">
                      We will try to detect fields like Name, DOB, Height,
                      Education, Job, Parents, Siblings, Contact etc.
                    </p>
                  </div>

                  {/* RIGHT: Preview + save */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
                    {profileData ? (
                      <>
                        <p className="text-[11px] text-slate-400 mb-2">
                          Preview of saved/parsed profile:
                        </p>
                        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                          {Object.keys(profileData).map((key) => (
                            <p key={key}>
                              <span className="font-semibold text-slate-200">
                                {key}:
                              </span>{" "}
                              <span className="text-slate-300">
                                {String(profileData[key])}
                              </span>
                            </p>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="mt-3 text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:bg-slate-600"
                        >
                          {saving
                            ? "Saving..."
                            : profileDocId
                            ? "Update Profile"
                            : "Save Profile"}
                        </button>

                        {status && (
                          <p className="mt-2 text-[11px] text-emerald-300">
                            {status}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        No profile found yet. Paste your biodata text on the
                        left and click &quot;Auto-fill from text&quot; to
                        create one.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "account" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-50 mb-1">
                Account & Security
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Basic account details. For password reset, please use the
                &quot;Forgot password&quot; option on the login screen.
              </p>

              <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-300">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2">
                  <User size={14} className="mt-[2px] text-slate-400" />
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">
                      Display Name
                    </p>
                    <p className="font-semibold text-slate-100">
                      {user.displayName || "Not set"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      This is the name we show on your member dashboard.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2">
                  <Shield size={14} className="mt-[2px] text-slate-400" />
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">
                      Login & Security
                    </p>
                    <p className="text-[11px] text-slate-300">
                      For now, you can reset your password via the email-based
                      &quot;Forgot password&quot; flow on the login screen.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Later, you can add dashboard options for password change,
                      phone login, and 2-step verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
