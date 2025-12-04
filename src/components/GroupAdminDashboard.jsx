// src/components/GroupAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { PlusCircle, Trash2, LogOut, Users, FileText, Share2 } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { parseBiodataHybrid } from "../utils/parseBiodata";
import Input from "./Input";
import { updateDoc } from "firebase/firestore";

// --------- HELPERS ---------

// Basic sanitization of text fields to avoid HTML/script injection
const sanitizeProfile = (data) => {
  const cleaned = {};
  Object.keys(data || {}).forEach((key) => {
    const value = data[key];
    if (typeof value === "string") {
      // strip HTML tags and trim, cap length
      const noTags = value.replace(/<[^>]*>/g, "").trim();
      cleaned[key] = noTags.slice(0, 500);
    } else {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// Transaction-based counter so globalProfileNo is unique (no race condition)
const getNextProfileNumbers = async (dbInstance, groupName) => {
  const counterRef = doc(dbInstance, "meta", "counters");
  const groupKey = `group_${groupName}`;

  const result = await runTransaction(dbInstance, async (tx) => {
    const snap = await tx.get(counterRef);
    let data = {};
    if (snap.exists()) {
      data = snap.data();
    }

    const nextGlobal = (data.globalProfile || 0) + 1;
    const nextGroup = (data[groupKey] || 0) + 1;

    tx.set(
      counterRef,
      {
        globalProfile: nextGlobal,
        [groupKey]: nextGroup,
      },
      { merge: true }
    );

    return { global: nextGlobal, group: nextGroup };
  });

  return result;
};

export default function GroupAdminDashboard({ user, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [view, setView] = useState("list");
  const [rawText, setRawText] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingProfileId, setEditingProfileId] = useState(null);


  // FETCH PROFILES FOR THIS GROUP
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!db || !user?.groupName) return;

      const q = query(
        collection(db, "profiles"),
        where("groupName", "==", user.groupName)
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setProfiles(data);
    };
    fetchProfiles();
  }, [view, user?.groupName]);

  // PARSE WHATSAPP BIODATA
  const handleParse = () => {
    if (!rawText.trim()) return;
    const data = parseBiodataHybrid(rawText);
    setFormData(data);
    setView("review");
  };

  // SAVE PROFILE with safe counters + sanitization
    // SAVE PROFILE with safe counters + sanitization
  const handleSave = async () => {
    if (!db) {
      alert("App is not connected to database.");
      return;
    }

    if (!user?.groupName) {
      alert("Invalid group. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const cleaned = sanitizeProfile(formData);

      if (editingProfileId) {
        // 🔵 EDIT EXISTING PROFILE
        const profileRef = doc(db, "profiles", editingProfileId);

        await updateDoc(profileRef, {
          ...cleaned,
          // keep meta fields (groupName, addedBy, globalProfileNo) as they are
          // just ensure groupName is correct
          groupName: user.groupName,
          updatedAt: serverTimestamp(),
        });

        setEditingProfileId(null);
        setSelectedProfile(null);
        setView("list");
      } else {
        // 🟢 CREATE NEW PROFILE – same as before
        const { global, group } = await getNextProfileNumbers(
          db,
          user.groupName
        );
        const globalProfileNo = `HS-${String(global).padStart(5, "0")}`;
        const groupProfileNo = `${user.groupName}-${group}`;

        await addDoc(collection(db, "profiles"), {
          ...cleaned,
          groupName: user.groupName,
          // enforce server-trusted identity, don't trust formData
          addedBy: user.email || user.uid || "unknown",
          createdAt: serverTimestamp(),
          globalProfileNo,
          groupProfileNo,
        });

        setRawText("");
        setFormData({});
        setView("list");
      }
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    }
    setLoading(false);
  };


  // DELETE PROFILE
  const handleDelete = async (id) => {
    if (window.confirm("Delete this profile?")) {
      await deleteDoc(doc(db, "profiles", id));
      setProfiles(profiles.filter((p) => p.id !== id));
    }
  };

  const handleChange = (field, val) =>
    setFormData({
      ...formData,
      [field]: val,
    });

  const renderInitial = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 hidden md:flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-r border-slate-800">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">
                {user?.groupName}
              </h2>
              <p className="text-[11px] text-slate-400">Partner Dashboard</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            <button
              onClick={() => setView("list")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                view === "list"
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <FileText size={15} />
              My Profiles
            </button>

            <button
              onClick={() => setView("add")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                view === "add"
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <PlusCircle size={15} />
              Add New
            </button>
          </nav>

          {/* Stats */}
          <div className="mt-8 space-y-3">
            <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700">
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.16em] mb-1">
                Total Profiles
              </p>
              <p className="text-xl font-semibold text-slate-50">
                {profiles.length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg px-3 py-2 transition"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-slate-900 text-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-5 md:py-7">
          {/* Top heading (for mobile too) */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-semibold text-slate-50">
                {user?.groupName}
              </h1>
              <p className="text-xs text-slate-400">
                Manage and publish biodata profiles
              </p>
            </div>
            <button
              onClick={() => setView("add")}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition md:hidden"
            >
              <PlusCircle size={14} />
              Add
            </button>
          </div>

          {/* LIST VIEW */}
          {view === "list" && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/40">
                {profiles.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 text-sm">
                    No profiles added yet. Click &ldquo;Add New&rdquo; to
                    publish your first biodata.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 py-3 hover:bg-slate-800/50 rounded-xl px-2 cursor-pointer transition"
                        onClick={() => {
                          setSelectedProfile(p);
                          setView("detail");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                            {renderInitial(p.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-50">
                                {p.name || "—"}
                              </p>
                              {p.globalProfileNo && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                  {p.globalProfileNo}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {p.age && `${p.age} yrs`}{" "}
                              {p.gender && `• ${p.gender}`}{" "}
                              {p.city && `• ${p.city}`}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {p.profession || "Profession not specified"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADD NEW */}
          {view === "add" && (
            <div className="max-w-2xl bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/50">
              <h2 className="text-lg font-semibold text-slate-50 mb-2">
                Paste WhatsApp Biodata
              </h2>
              <p className="text-[11px] text-slate-400 mb-4">
                Paste the full WhatsApp biodata text. We&apos;ll auto-extract
                name, DOB, height, profession, family details and more. You
                can review & edit before publishing.
              </p>

              <textarea
                className="w-full h-48 p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 outline-none focus:ring-2 focus:ring-rose-500/60 focus:border-rose-500/60 font-mono mb-4"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste biodata from WhatsApp…"
              />

              <button
                onClick={handleParse}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:scale-[1.01] transition"
              >
                <FileText size={15} />
                Parse Data
              </button>
            </div>
          )}

          {/* REVIEW PANEL */}
          {/* REVIEW PANEL – PREMIUM UI */}
{view === "review" && (
  <div className="max-w-4xl mx-auto">
    {/* top gradient accent */}
    <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 rounded-full mb-3" />

    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold mb-1">
  {editingProfileId ? "Edit Existing Profile" : "Step 2 · Review & Edit"}
</p>
<h2 className="text-xl md:text-2xl font-semibold text-slate-50">
  {editingProfileId ? "Update biodata details" : "Confirm biodata before publishing"}
</h2>

          <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
            We’ve auto-filled these details from the WhatsApp biodata.
            Please correct spellings, complete missing fields, and then
            click <span className="font-semibold text-emerald-400">Publish Profile</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 mr-1" />
          Parsed from WhatsApp text
        </div>
      </div>

      {/* Form grid */}
      <div className="space-y-5 mb-6 text-xs">
        {/* Basic details */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
              Basic Information
            </h3>
            <span className="text-[10px] text-slate-500">
              Name, gender, age, birth details &amp; height
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              val={formData.name}
              onChange={(v) => handleChange("name", v)}
            />
            <Input
              label="Gender"
              val={formData.gender}
              onChange={(v) => handleChange("gender", v)}
            />
            <Input
              label="Age"
              val={formData.age}
              onChange={(v) => handleChange("age", v)}
            />
            <Input
              label="DOB"
              val={formData.dob}
              onChange={(v) => handleChange("dob", v)}
            />
            <Input
              label="Height"
              val={formData.height}
              onChange={(v) => handleChange("height", v)}
            />
            <Input
              label="Manglik"
              val={formData.manglik}
              onChange={(v) => handleChange("manglik", v)}
            />
          </div>
        </div>

        {/* Education & Work */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
              Education &amp; Career
            </h3>
            <span className="text-[10px] text-slate-500">
              Qualification, job, company &amp; income
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Education"
              val={formData.education}
              onChange={(v) => handleChange("education", v)}
              full
            />
            <Input
              label="Profession"
              val={formData.profession}
              onChange={(v) => handleChange("profession", v)}
              full
            />
            <Input
              label="Company / Business"
              val={formData.company}
              onChange={(v) => handleChange("company", v)}
              full
            />
            <Input
              label="Income"
              val={formData.income}
              onChange={(v) => handleChange("income", v)}
            />
            <Input
              label="Diet"
              val={formData.diet}
              onChange={(v) => handleChange("diet", v)}
            />
          </div>
        </div>

        {/* Location & Caste */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
              Location &amp; Background
            </h3>
            <span className="text-[10px] text-slate-500">
              City, birth place, address, caste &amp; gotra
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              val={formData.city || formData.pob}
              onChange={(v) => {
                handleChange("city", v);
                if (!formData.pob) handleChange("pob", v);
              }}
            />
            <Input
              label="Birth Place"
              val={formData.pob}
              onChange={(v) => handleChange("pob", v)}
            />
            <Input
              label="Address"
              val={formData.address}
              onChange={(v) => handleChange("address", v)}
              full
            />
            <Input
              label="Caste"
              val={formData.caste}
              onChange={(v) => handleChange("caste", v)}
            />
            <Input
              label="Gotra"
              val={formData.gotra}
              onChange={(v) => handleChange("gotra", v)}
            />
          </div>
        </div>

        {/* Family & Contact */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
              Family &amp; Contact
            </h3>
            <span className="text-[10px] text-slate-500">
              Parents, siblings &amp; main contact number
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Father Name"
              val={formData.father}
              onChange={(v) => handleChange("father", v)}
            />
            <Input
              label="Father Occupation"
              val={formData.fatherOcc}
              onChange={(v) => handleChange("fatherOcc", v)}
            />
            <Input
              label="Mother Name"
              val={formData.mother}
              onChange={(v) => handleChange("mother", v)}
            />
            <Input
              label="Mother Occupation"
              val={formData.motherOcc}
              onChange={(v) => handleChange("motherOcc", v)}
            />
            <Input
              label="Siblings"
              val={formData.siblings}
              onChange={(v) => handleChange("siblings", v)}
              full
            />
            <Input
              label="Contact (WhatsApp / Mobile)"
              val={formData.contact}
              onChange={(v) => handleChange("contact", v)}
              full
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        <button
  type="button"
  onClick={() => {
    if (editingProfileId && selectedProfile) {
      // go back to detail view if we came from there
      setView("detail");
    } else {
      setView("add");
    }
  }}
  className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-900/80 transition"
>
  {editingProfileId ? "← Cancel Editing" : "← Back to Paste Screen"}
</button>

<button
  onClick={handleSave}
  disabled={loading}
  className="w-full md:w-auto inline-flex items-center justify-center gap-2 text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed"
>
  {loading
    ? editingProfileId ? "Updating…" : "Saving…"
    : editingProfileId ? "Update Profile" : "Publish Profile"}
</button>

      </div>
    </div>
  </div>
)}


          {/* DETAIL VIEW – FULL BIODATA */}
          {view === "detail" && selectedProfile && (
  <div className="max-w-4xl bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-2xl shadow-black/50">
    <div className="flex items-center justify-between mb-3">
      <button
        onClick={() => {
          setView("list");
          setSelectedProfile(null);
        }}
        className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline"
      >
        ← Back to My Profiles
      </button>

      <button
        onClick={() => {
          // pre-fill form with existing profile and go to review screen
          setFormData(selectedProfile);
          setEditingProfileId(selectedProfile.id);
          setView("review");
        }}
        className="inline-flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700"
      >
        Edit Profile
      </button>
    </div>


              {/* Header */}
              <div className="flex flex-wrap items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                  {renderInitial(selectedProfile.name)}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h2 className="text-xl font-semibold text-slate-50 mb-1">
                    {selectedProfile.name}
                  </h2>

                  <p className="text-xs text-slate-400 mb-1">
                    {selectedProfile.age && `${selectedProfile.age} yrs`}{" "}
                    {selectedProfile.gender && `• ${selectedProfile.gender}`}{" "}
                    {selectedProfile.height && `• ${selectedProfile.height}`}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
                    {selectedProfile.globalProfileNo && (
                      <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
                        Profile No: {selectedProfile.globalProfileNo}
                      </span>
                    )}
                    {selectedProfile.groupProfileNo && (
                      <span className="px-2 py-1 rounded-full bg-indigo-900/60 border border-indigo-700 text-indigo-100">
                        Group: {selectedProfile.groupProfileNo}
                      </span>
                    )}
                    {selectedProfile.groupName && (
                      <span className="px-2 py-1 rounded-full bg-rose-900/60 border border-rose-700 text-rose-100">
                        {selectedProfile.groupName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs md:text-sm text-slate-200">
                {/* Basic / Astro */}
                <div className="space-y-2">
                  <Field label="DOB" value={selectedProfile.dob} />
                  <Field label="Birth Time" value={selectedProfile.tob} />
                  <Field label="Birth Place" value={selectedProfile.pob} />
                  <Field label="Manglik" value={selectedProfile.manglik} />
                  <Field label="Diet" value={selectedProfile.diet} />
                </div>

                {/* Education & Work */}
                <div className="space-y-2">
                  <Field label="Education" value={selectedProfile.education} />
                  <Field label="Profession" value={selectedProfile.profession} />
                  <Field label="Company / Business" value={selectedProfile.company} />
                  <Field label="Income" value={selectedProfile.income} />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Field
                    label="City"
                    value={
                      selectedProfile.city ||
                      selectedProfile.pob ||
                      selectedProfile.address
                    }
                  />
                  <Field label="Address" value={selectedProfile.address} />
                  <Field
                    label="Caste / Gotra"
                    value={
                      selectedProfile.caste ||
                      selectedProfile.gotra
                        ? `${selectedProfile.caste || ""}${
                            selectedProfile.gotra ? ` • ${selectedProfile.gotra}` : ""
                          }`
                        : ""
                    }
                  />
                </div>

                {/* Family */}
                <div className="space-y-2">
                  <Field
                    label="Father"
                    value={selectedProfile.father}
                    extra={selectedProfile.fatherOcc}
                  />
                  <Field
                    label="Mother"
                    value={selectedProfile.mother}
                    extra={selectedProfile.motherOcc}
                  />
                  <Field label="Siblings" value={selectedProfile.siblings} />
                </div>

                {/* Contact & Share */}
                <div className="md:col-span-2 space-y-3">
                  {/* Do NOT show raw contact here in case screen is shared */}
                  <Field
                    label="Contact"
                    value="Contact details are shared only with authorized partners. Please connect via your group admin."
                    mono
                  />
                  {selectedProfile.globalProfileNo && (
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}?profile=${selectedProfile.globalProfileNo}`;
                        navigator.clipboard.writeText(shareUrl);
                        alert("Profile link copied!");
                      }}
                      className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-indigo-500 text-indigo-300 hover:bg-indigo-500/10 transition"
                    >
                      <Share2 size={14} />
                      Copy Shareable Profile Link
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    Added by: {selectedProfile.addedBy || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const Field = ({ label, value, extra, mono }) => {
  if (!value && !extra) return null;
  return (
    <div>
      <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-[0.16em] mb-0.5">
        {label}
      </p>
      <p className={`${mono ? "font-mono" : ""} text-slate-100`}>
        {value || "—"}
      </p>
      {extra && (
        <p className="text-[11px] text-slate-400 mt-0.5">
          {extra}
        </p>
      )}
    </div>
  );
};
