// src/components/GroupAdminDashboard.jsx

import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Trash2,
  LogOut,
  Share2,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  Heart,
} from "lucide-react";


import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

import Input from "./Input";

import parseBiodata from "../utils//parseBiodata";

function renderInitial(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export default function GroupAdminDashboard({ user, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("list"); // 'list' | 'detail' | 'add' | 'edit'
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingProfileId, setEditingProfileId] = useState(null);

  const [rawText, setRawText] = useState("");
  const [formData, setFormData] = useState({});

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterCaste, setFilterCaste] = useState("");
  const [filterManglik, setFilterManglik] = useState("All");


const sanitize = (val) => {
  if (!val) return "";
  return val
    .toString()
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 500);
};



  // ========== FETCH PROFILES FOR THIS GROUP ADMIN ==========
  useEffect(() => {
    if (!user || !db) return;

    
    const q = query(
      collection(db, "profiles"),
      where("groupName", "==", user.groupName),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProfiles(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading profiles:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // ========== FILTERED LIST ==========

  const filteredProfiles = profiles.filter((p) => {
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.profession?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term) ||
      p.globalProfileNo?.toLowerCase().includes(term) ||
      p.groupProfileNo?.toLowerCase().includes(term);

    const matchesGender = filterGender === "All" || p.gender === filterGender;

    const ageNum = parseInt(p.age, 10);
    let matchesAge = true;
    const hasAgeFilter = minAge || maxAge;

    if (hasAgeFilter) {
      if (isNaN(ageNum)) {
        matchesAge = false;
      } else {
        if (minAge && ageNum < Number(minAge)) matchesAge = false;
        if (maxAge && ageNum > Number(maxAge)) matchesAge = false;
      }
    }

    const citySource = (p.city || p.pob || "").toLowerCase();
    const matchesCity =
      !filterCity || citySource.includes(filterCity.toLowerCase());

    const casteSource = (p.caste || p.gotra || "").toLowerCase();
    const matchesCaste =
      !filterCaste || casteSource.includes(filterCaste.toLowerCase());

    const manglikValue = (p.manglik || "").toLowerCase();
    const matchesManglik =
      filterManglik === "All" ||
      (filterManglik === "Yes" && manglikValue.startsWith("y")) ||
      (filterManglik === "No" && manglikValue.startsWith("n"));

    return (
      matchesSearch &&
      matchesGender &&
      matchesAge &&
      matchesCity &&
      matchesCaste &&
      matchesManglik
    );
  });

  // ========== CRUD HANDLERS ==========

  const clearForm = () => {
    setFormData({});
    setRawText("");
    setEditingProfileId(null);
  };

  const handleParseText = () => {
    if (!rawText.trim()) return;
    try {
      const parsed = parseBiodata(rawText);
      setFormData((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch (e) {
      console.error("Parse error:", e);
      alert("Could not parse biodata. Please check the format.");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!db) return;

    try {

      const cleanData = {};
Object.keys(formData || {}).forEach((k) => {
  cleanData[k] = sanitize(formData[k]);
});

      const baseData = {
        ...formData,
        addedBy:user.email,
        groupAdminUid: user.uid,
        groupName: user.groupName || formData.groupName || "",
        groupId: user.groupId || formData.groupId || "",
        memberUid:null,
        updatedAt: serverTimestamp(),
      };

      if (editingProfileId) {
        // Update existing
        delete baseData.memberUid; // 🚫 never touch member ownership
        await updateDoc(doc(db, "profiles", editingProfileId), baseData);
      } else {
        // New profile
        await addDoc(collection(db, "profiles"), {
          ...baseData,
          createdAt: serverTimestamp(),
        });
      }

      clearForm();
      setView("list");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Error saving profile. Check console for details.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this profile permanently?")) return;
    try {
      await deleteDoc(doc(db, "profiles", id));
      if (selectedProfile?.id === id) {
        setSelectedProfile(null);
        setView("list");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Could not delete profile.");
    }
  };

  const openDetail = (p) => {
    setSelectedProfile(p);
    setView("detail");
  };

  const openEdit = (p) => {
    setEditingProfileId(p.id);
    setFormData(p);
    setView("add");
  };

  const copyLink = (p) => {
    if (!p.globalProfileNo) {
      alert("This profile is not published yet.");
      return;
    }
    const url = `${window.location.origin}/p/${p.globalProfileNo}`;
    navigator.clipboard.writeText(url);
    alert("Trusathi profile link copied.\n\nShared via Trusathi.com");
  };

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* TOP BAR */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-rose-500 to-purple-500 p-1.5 rounded-lg">
              <Heart size={18} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">
                TruSathi Partner Console
              </span>
              <span className="text-[10px] text-slate-400">
                {user?.groupName || "Group Admin"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[11px] text-slate-400">
              {user?.email}
            </span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-slate-700 hover:border-rose-500 hover:text-rose-300 transition"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[2fr,1.4fr] gap-4">
        {/* LEFT COLUMN – LIST / DETAIL */}
        <section className="space-y-4">
          {/* SUMMARY CARD */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                My Profiles
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You have{" "}
                <span className="font-semibold text-slate-50">
                  {profiles.length}
                </span>{" "}
                profiles in this group.
              </p>
            </div>
            <button
              onClick={() => {
                clearForm();
                setView("add");
              }}
              className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-500 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition"
            >
              <PlusCircle size={14} />
              Add New Profile
            </button>
          </div>

          {/* LIST VIEW – with filters */}
          {view === "list" && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl shadow-black/50">
                {/* Header + count */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                      Group Profiles
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Showing{" "}
                      <span className="font-semibold text-slate-100">
                        {filteredProfiles.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-100">
                        {profiles.length}
                      </span>{" "}
                      profiles
                    </p>
                  </div>
                </div>

                {/* FILTER BAR */}
                <div className="space-y-3 mb-4">
                  {/* Row 1 – main search + gender */}
                  <div className="flex flex-col md:flex-row gap-3 items-stretch">
                    <div className="flex-1 flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2 border border-slate-700">
                      <span className="text-slate-400 text-[11px] font-medium uppercase tracking-[0.16em]">
                        Search
                      </span>
                      <input
                        className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                        placeholder="Name, profession, city, profile no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        className="px-3 py-2 bg-slate-900 rounded-xl text-xs md:text-sm text-slate-100 border border-slate-700 outline-none"
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Female">Brides</option>
                        <option value="Male">Grooms</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2 – advanced filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    {/* Age */}
                    <div className="bg-slate-900 rounded-xl px-2 py-1.5 flex items-center gap-1.5 border border-slate-800">
                      <span className="uppercase tracking-[0.16em] text-slate-500">
                        Age
                      </span>
                      <input
                        type="number"
                        min="18"
                        className="w-12 bg-transparent border-b border-slate-700 text-xs text-slate-100 px-1 py-0.5 outline-none"
                        placeholder="Min"
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                      />
                      <span className="text-slate-500">–</span>
                      <input
                        type="number"
                        min="18"
                        className="w-12 bg-transparent border-b border-slate-700 text-xs text-slate-100 px-1 py-0.5 outline-none"
                        placeholder="Max"
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value)}
                      />
                    </div>

                    {/* City */}
                    <div className="bg-slate-900 rounded-xl px-2 py-1.5 flex items-center gap-1.5 border border-slate-800">
                      <span className="uppercase tracking-[0.16em] text-slate-500">
                        City
                      </span>
                      <input
                        className="flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
                        placeholder="e.g. Delhi, Jaipur"
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                      />
                    </div>

                    {/* Caste / Gotra */}
                    <div className="bg-slate-900 rounded-xl px-2 py-1.5 flex items-center gap-1.5 border border-slate-800">
                      <span className="uppercase tracking-[0.16em] text-slate-500">
                        Caste
                      </span>
                      <input
                        className="flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
                        placeholder="e.g. Aggarwal"
                        value={filterCaste}
                        onChange={(e) => setFilterCaste(e.target.value)}
                      />
                    </div>

                    {/* Manglik */}
                    <div className="bg-slate-900 rounded-xl px-2 py-1.5 flex items-center justify-between gap-1.5 border border-slate-800">
                      <span className="uppercase tracking-[0.16em] text-slate-500">
                        Manglik
                      </span>
                      <select
                        className="bg-transparent text-xs text-slate-100 outline-none"
                        value={filterManglik}
                        onChange={(e) => setFilterManglik(e.target.value)}
                      >
                        <option value="All">Any</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* LIST ITSELF */}
                {loading ? (
                  <div className="py-10 text-center text-slate-500 text-sm">
                    Loading profiles...
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 text-sm">
                    No profiles added yet. Click &ldquo;Add New
                    Profile&rdquo; to publish your first biodata.
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="text-center text-slate-500 py-10 text-sm">
                    No profiles match the current filters. Try changing
                    search or filters.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {filteredProfiles.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 py-3 hover:bg-slate-900 rounded-xl px-2 cursor-pointer transition"
                        onClick={() => openDetail(p)}
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
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                                  {p.globalProfileNo}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {p.age && `${p.age} yrs`}{" "}
                              {p.gender && `• ${p.gender}`}{" "}
                              {(p.city || p.pob) && `• ${p.city || p.pob}`}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {p.profession || "Profession not specified"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(p);
                            }}
                            className="text-[11px] px-2 py-1 rounded-lg border border-slate-700 text-slate-200 hover:border-indigo-500 hover:text-indigo-300 transition"
                          >
                            Edit
                          </button>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === "detail" && selectedProfile && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl shadow-black/50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                    {renderInitial(selectedProfile.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedProfile.name}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {selectedProfile.age &&
                        `${selectedProfile.age} yrs`}{" "}
                      {selectedProfile.gender &&
                        `• ${selectedProfile.gender}`}{" "}
                      {selectedProfile.height &&
                        `• ${selectedProfile.height}`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {selectedProfile.globalProfileNo &&
                        `Global No: ${selectedProfile.globalProfileNo}`}{" "}
                      {selectedProfile.groupProfileNo &&
                        ` | Group No: ${selectedProfile.groupProfileNo}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setView("list");
                    setSelectedProfile(null);
                  }}
                  className="text-[11px] px-2 py-1 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 transition"
                >
                  Back
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-200 mb-4">
                <DetailField
                  icon={<Briefcase size={13} />}
                  label="Education"
                  value={selectedProfile.education}
                />
                <DetailField
                  icon={<Briefcase size={13} />}
                  label="Profession"
                  value={selectedProfile.profession}
                />
                <DetailField label="Company" value={selectedProfile.company} />
                <DetailField label="Income" value={selectedProfile.income} />
                <DetailField
                  icon={<MapPin size={13} />}
                  label="City / Location"
                  value={
                    selectedProfile.city ||
                    selectedProfile.pob ||
                    selectedProfile.address
                  }
                />
                <DetailField
                  icon={<Calendar size={13} />}
                  label="DOB"
                  value={selectedProfile.dob}
                />
                <DetailField label="Birth Time" value={selectedProfile.tob} />
                <DetailField label="Birth Place" value={selectedProfile.pob} />
                <DetailField label="Diet" value={selectedProfile.diet} />
                <DetailField
                  label="Caste / Gotra"
                  value={
                    selectedProfile.caste ||
                    selectedProfile.gotra
                      ? `${selectedProfile.caste || ""}${
                          selectedProfile.gotra
                            ? ` • ${selectedProfile.gotra}`
                            : ""
                        }`
                      : ""
                  }
                />
                <DetailField label="Manglik" value={selectedProfile.manglik} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-200 mb-4">
                <DetailField
                  icon={<Users size={13} />}
                  label="Father"
                  value={selectedProfile.father}
                  extra={selectedProfile.fatherOcc}
                />
                <DetailField
                  icon={<Users size={13} />}
                  label="Mother"
                  value={selectedProfile.mother}
                  extra={selectedProfile.motherOcc}
                />
                <DetailField label="Siblings" value={selectedProfile.siblings} />
                <DetailField label="Address" value={selectedProfile.address} />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => openEdit(selectedProfile)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-slate-600 text-slate-100 hover:border-indigo-500 hover:text-indigo-300 transition"
                >
                  Edit Profile
                </button>

                <button
                  onClick={() => handleDelete(selectedProfile.id)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-rose-500/70 text-rose-300 hover:bg-rose-500/10 transition"
                >
                  <Trash2 size={14} />
                  Delete
                </button>

                <button
                  onClick={() => copyLink(selectedProfile)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-indigo-500/70 text-indigo-300 hover:bg-indigo-500/10 transition"
                >
                  <Share2 size={14} />
                  Copy Public Link
                </button>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN – ADD / EDIT */}
        <section className="space-y-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl shadow-black/50 h-full">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                  {editingProfileId ? "Edit Profile" : "Add New Profile"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste WhatsApp biodata or fill manually.
                </p>
              </div>
            </div>

            {/* RAW TEXT PARSE */}
            <div className="mb-3">
              <textarea
                className="w-full min-h-[90px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                placeholder="Paste full biodata text from WhatsApp here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <div className="flex justify-between mt-1">
                <button
                  type="button"
                  onClick={handleParseText}
                  className="text-[11px] px-2 py-1 rounded-lg border border-slate-700 text-slate-200 hover:border-indigo-500 hover:text-indigo-300 transition"
                >
                  Parse & Fill
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleAddOrUpdate} className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
                <Input
                  label="Gender"
                  value={formData.gender || ""}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  placeholder="Male / Female"
                />
                <Input
                  label="Age"
                  value={formData.age || ""}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
                <Input
                  label="Height"
                  value={formData.height || ""}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                />
                <Input
                  label="Education"
                  value={formData.education || ""}
                  onChange={(e) =>
                    handleInputChange("education", e.target.value)
                  }
                />
                <Input
                  label="Profession"
                  value={formData.profession || ""}
                  onChange={(e) =>
                    handleInputChange("profession", e.target.value)
                  }
                />
                <Input
                  label="Company"
                  value={formData.company || ""}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
                <Input
                  label="Income"
                  value={formData.income || ""}
                  onChange={(e) => handleInputChange("income", e.target.value)}
                />
                <Input
                  label="City"
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
                <Input
                  label="Address"
                  value={formData.address || ""}
                  onChange={(e) =>
                    handleInputChange("address", e.target.value)
                  }
                />
                <Input
                  label="DOB"
                  value={formData.dob || ""}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
                <Input
                  label="Birth Time"
                  value={formData.tob || ""}
                  onChange={(e) => handleInputChange("tob", e.target.value)}
                />
                <Input
                  label="Birth Place"
                  value={formData.pob || ""}
                  onChange={(e) => handleInputChange("pob", e.target.value)}
                />
                <Input
                  label="Diet"
                  value={formData.diet || ""}
                  onChange={(e) => handleInputChange("diet", e.target.value)}
                />
                <Input
                  label="Caste"
                  value={formData.caste || ""}
                  onChange={(e) => handleInputChange("caste", e.target.value)}
                />
                <Input
                  label="Gotra"
                  value={formData.gotra || ""}
                  onChange={(e) => handleInputChange("gotra", e.target.value)}
                />
                <Input
                  label="Manglik"
                  value={formData.manglik || ""}
                  onChange={(e) =>
                    handleInputChange("manglik", e.target.value)
                  }
                />
                <Input
                  label="Father"
                  value={formData.father || ""}
                  onChange={(e) => handleInputChange("father", e.target.value)}
                />
                <Input
                  label="Father Occupation"
                  value={formData.fatherOcc || ""}
                  onChange={(e) =>
                    handleInputChange("fatherOcc", e.target.value)
                  }
                />
                <Input
                  label="Mother"
                  value={formData.mother || ""}
                  onChange={(e) => handleInputChange("mother", e.target.value)}
                />
                <Input
                  label="Mother Occupation"
                  value={formData.motherOcc || ""}
                  onChange={(e) =>
                    handleInputChange("motherOcc", e.target.value)
                  }
                />
                <Input
                  label="Siblings"
                  value={formData.siblings || ""}
                  onChange={(e) =>
                    handleInputChange("siblings", e.target.value)
                  }
                />
                <Input
                  label="Group Profile No"
                  value={formData.groupProfileNo || ""}
                  onChange={(e) =>
                    handleInputChange("groupProfileNo", e.target.value)
                  }
                />
                <Input
                  label="Global Profile No"
                  value={formData.globalProfileNo || ""}
                  onChange={(e) =>
                    handleInputChange("globalProfileNo", e.target.value)
                  }
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition"
                >
                  {editingProfileId ? "Update Profile" : "Save Profile"}
                </button>

                {editingProfileId && (
                  <button
                    type="button"
                    onClick={() => {
                      clearForm();
                      setView("list");
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function DetailField({ icon, label, value, extra }) {
  if (!value && !extra) return null;
  return (
    <div>
      <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-[0.12em] mb-0.5 flex items-center gap-1.5">
        {icon && <span className="text-slate-500">{icon}</span>}
        {label}
      </p>
      <p className="text-xs text-slate-100">{value || "—"}</p>
      {extra && (
        <p className="text-[11px] text-slate-400 mt-0.5">{extra}</p>
      )}
    </div>
  );
}
