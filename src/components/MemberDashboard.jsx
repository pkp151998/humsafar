// src/components/MemberDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  LogOut,
  User,
  Shield,
  HeartHandshake,
  FileText,
  Edit3,
} from "lucide-react";
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

// Small helper for read-only display
const FieldRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <p className="text-xs text-slate-200">
      <span className="font-semibold text-slate-300">{label}:</span>{" "}
      <span className="text-slate-100">{value}</span>
    </p>
  );
};

export default function MemberDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview"); // "overview" | "profile" | "account";

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const [rawText, setRawText] = useState("");
  const [profileDocId, setProfileDocId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false); // controls edit vs read-only view

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
          setEditMode(false); // we start in read-only view if profile exists
        } else {
          // no profile yet: start with blank editable form
          setProfileData({});
          setEditMode(true);
        }
      } catch (e) {
        console.error(e);
      }
      setLoadingProfile(false);
    };

    loadProfile();
  }, [user?.uid]);

  // Helper to update a single field in profileData
  const updateField = (field, value) => {
    setProfileData((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  // Parse WhatsApp biodata text (OPTIONAL)
  const handleParse = () => {
    setStatus("");
    if (!rawText.trim()) return;
    const parsed = parseBiodataHybrid(rawText);
    // Merge parsed fields into existing profileData
    setProfileData((prev) => ({
      ...(prev || {}),
      ...parsed,
    }));
  };

  // Save or update profile in /profiles
  const handleSaveProfile = async () => {
    if (!db || !user?.uid) {
      setStatus("App is not connected to database.");
      return;
    }

    if (!profileData || !profileData.name) {
      setStatus("Please fill at least Name before saving.");
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
        addedBy:null,
        groupName:null,
        groupAdminUid:null,
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
        payload.memberUid = user.uid; // force ownership
        await updateDoc(ref, payload);
        setStatus("Profile updated successfully.");
      }

      // After successful save, go back to read-only view
      setEditMode(false);
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
                TruSathi Member
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
                You&apos;re logged in as a Trusathi member. You can maintain a
                clean, standard biodata. &quot;Parse My Data&quot; is just an
                optional helper on top of the standard form.
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
                    Fill the standard form carefully; admins use this to
                    shortlist matches.
                  </li>
                  <li>
                    &quot;Parse My Data&quot; can speed things up but always
                    review the fields.
                  </li>
                  <li>
                    Contact details are visible only to admins and trusted
                    partners, not to general public.
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

              {loadingProfile ? (
                <p className="text-xs text-slate-400 mt-2">
                  Loading your profile…
                </p>
              ) : (
                <>
                  {/* CASE 1: profile exists && NOT in edit mode → READ-ONLY VIEW */}
                  {profileDocId && !editMode && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-400">
                          This is your saved biodata as seen by admins. Click
                          &quot;Edit Profile&quot; to update any details.
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditMode(true)}
                          className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700"
                        >
                          <Edit3 size={12} />
                          Edit Profile
                        </button>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 grid md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <FieldRow label="Full Name" value={profileData?.name} />
                          <FieldRow label="Gender" value={profileData?.gender} />
                          <FieldRow label="Age" value={profileData?.age} />
                          <FieldRow label="Height" value={profileData?.height} />
                          <FieldRow label="Complexion" value={profileData?.complexion} />
                        </div>
                        <div className="space-y-1">
                          <FieldRow label="Date of Birth" value={profileData?.dob} />
                          <FieldRow label="Birth Time" value={profileData?.tob} />
                          <FieldRow label="Birth Place" value={profileData?.pob} />
                          <FieldRow label="Manglik" value={profileData?.manglik} />
                          <FieldRow label="Diet" value={profileData?.diet} />
                        </div>

                        <div className="space-y-1">
                          <FieldRow label="Education" value={profileData?.education} />
                          <FieldRow label="Profession" value={profileData?.profession} />
                          <FieldRow label="Company" value={profileData?.company} />
                          <FieldRow label="Income" value={profileData?.income} />
                        </div>
                        <div className="space-y-1">
                          <FieldRow label="City / Location" value={profileData?.city} />
                          <FieldRow label="Caste" value={profileData?.caste} />
                          <FieldRow label="Gotra" value={profileData?.gotra} />
                          <FieldRow label="Contact" value={profileData?.contact} />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <FieldRow label="Address" value={profileData?.address} />
                        </div>

                        <div className="space-y-1">
                          <FieldRow label="Father" value={profileData?.father} />
                          <FieldRow
                            label="Father's Occupation"
                            value={profileData?.fatherOcc}
                          />
                          <FieldRow label="Mother" value={profileData?.mother} />
                          <FieldRow
                            label="Mother's Occupation"
                            value={profileData?.motherOcc}
                          />
                        </div>
                        <div className="space-y-1">
                          <FieldRow
                            label="Siblings (brothers / sisters)"
                            value={profileData?.siblings}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CASE 2: either no profile OR in edit mode → EDIT FORM + PARSE SECTION */}
                  {(!profileDocId || editMode) && (
                    <div className="mt-3 space-y-4">
                      {profileDocId && (
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] text-amber-300">
                            You are editing your saved biodata. After saving, you
                            will return to read-only view.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditMode(false);
                              setStatus("");
                            }}
                            className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            Cancel Edit
                          </button>
                        </div>
                      )}

                      {/* STANDARD FORM – FULL WIDTH */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Full Name
                            </label>
                            <input
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                              value={profileData?.name || ""}
                              onChange={(e) => updateField("name", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Gender
                            </label>
                            <select
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                              value={profileData?.gender || ""}
                              onChange={(e) =>
                                updateField("gender", e.target.value)
                              }
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Age
                            </label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                              value={profileData?.age || ""}
                              onChange={(e) =>
                                updateField("age", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Height
                            </label>
                            <input
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                              placeholder={"e.g. 5'7\""}
                              value={profileData?.height || ""}
                              onChange={(e) =>
                                updateField("height", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-400 mb-2 font-semibold">
                            Birth & Astro
                          </p>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Date of Birth
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                placeholder="DD/MM/YYYY"
                                value={profileData?.dob || ""}
                                onChange={(e) =>
                                  updateField("dob", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Birth Time
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                placeholder="HH:MM"
                                value={profileData?.tob || ""}
                                onChange={(e) =>
                                  updateField("tob", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Birth Place
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.pob || ""}
                                onChange={(e) =>
                                  updateField("pob", e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3 mt-3">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Manglik
                              </label>
                              <select
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.manglik || ""}
                                onChange={(e) =>
                                  updateField("manglik", e.target.value)
                                }
                              >
                                <option value="">Select</option>
                                <option value="Manglik">Manglik</option>
                                <option value="Non-Manglik">Non-Manglik</option>
                                <option value="Anshik">Anshik Manglik</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Diet
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                placeholder="Veg / Non-veg / Eggetarian"
                                value={profileData?.diet || ""}
                                onChange={(e) =>
                                  updateField("diet", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Complexion
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.complexion || ""}
                                onChange={(e) =>
                                  updateField("complexion", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-400 mb-2 font-semibold">
                            Education & Work
                          </p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Education
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.education || ""}
                                onChange={(e) =>
                                  updateField("education", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Profession / Occupation
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.profession || ""}
                                onChange={(e) =>
                                  updateField("profession", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Company / Organization
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.company || ""}
                                onChange={(e) =>
                                  updateField("company", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Income / Package
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                placeholder="e.g. 10 LPA"
                                value={profileData?.income || ""}
                                onChange={(e) =>
                                  updateField("income", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-400 mb-2 font-semibold">
                            Family Details
                          </p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Father&apos;s Name
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.father || ""}
                                onChange={(e) =>
                                  updateField("father", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Father&apos;s Occupation
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.fatherOcc || ""}
                                onChange={(e) =>
                                  updateField("fatherOcc", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Mother&apos;s Name
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.mother || ""}
                                onChange={(e) =>
                                  updateField("mother", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Mother&apos;s Occupation
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.motherOcc || ""}
                                onChange={(e) =>
                                  updateField("motherOcc", e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Siblings (brothers / sisters)
                            </label>
                            <input
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                              value={profileData?.siblings || ""}
                              onChange={(e) =>
                                updateField("siblings", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-400 mb-2 font-semibold">
                            Contact & Location
                          </p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                City / Current Location
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                value={profileData?.city || ""}
                                onChange={(e) =>
                                  updateField("city", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Caste / Gotra
                              </label>
                              <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                                placeholder="e.g. Aggarwal, Goel gotra"
                                value={
                                  profileData?.caste || profileData?.gotra || ""
                                }
                                onChange={(e) =>
                                  updateField("caste", e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Full Address (optional)
                            </label>
                            <textarea
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 h-16"
                              value={profileData?.address || ""}
                              onChange={(e) =>
                                updateField("address", e.target.value)
                              }
                            />
                          </div>
                          <div className="mt-3">
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Contact Number (WhatsApp)
                            </label>
                            <input
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                              placeholder="e.g. +91XXXXXXXXXX"
                              value={profileData?.contact || ""}
                              onChange={(e) =>
                                updateField("contact", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="text-[11px] px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:bg-slate-600"
                          >
                            {saving
                              ? "Saving..."
                              : profileDocId
                              ? "Update Profile"
                              : "Save Profile"}
                          </button>
                          {status && (
                            <p className="text-[11px] text-emerald-300">
                              {status}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* OPTIONAL PARSE SECTION – BELOW FORM */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                        <p className="text-[11px] text-slate-300 font-semibold">
                          Parse My Data (Optional)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Paste your WhatsApp biodata text here. We will try to
                          auto-fill fields like Name, DOB, Height, Education,
                          Job, Family, Contact, etc. You can still edit
                          everything above before saving.
                        </p>
                        <textarea
                          className="w-full h-32 bg-slate-950/90 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 mb-2"
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          placeholder="Paste your full biodata from WhatsApp..."
                        />
                        <button
                          type="button"
                          onClick={handleParse}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:bg-slate-600"
                          disabled={!rawText.trim()}
                        >
                          Parse &amp; Merge Into Form
                        </button>
                      </div>

                      {/* PREVIEW – FULL WIDTH BELOW */}
                      {profileData && Object.keys(profileData).length > 0 && (
                        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs">
                          <p className="text-[11px] text-slate-300 font-semibold mb-2">
                            Current Form Preview
                          </p>
                          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
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
                        </div>
                      )}
                    </div>
                  )}
                </>
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
