// src/components/PublicHome.jsx
import React, { useState } from "react";
import { Heart, MapPin, Briefcase, Phone, Share2 } from "lucide-react";

const APP_NAME = "Humsafar";
const APP_TAGLINE = "Rishtey wahi, jo dil se judey.";

export default function PublicHome({
  profiles,
  onAdminLoginClick,
  onMemberLoginClick,
  loading,
}) {

  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [selectedProfile, setSelectedProfile] = useState(null);

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pob?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGender =
      filterGender === "All" || p.gender === filterGender;

    return matchesSearch && matchesGender;
  });

  const renderInitial = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-rose-500 to-purple-600 p-1.5 rounded-xl text-white shadow-sm">
              <Heart size={20} fill="white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                {APP_NAME}
              </span>
              <span className="text-[11px] text-slate-500 uppercase">
                Premium Matrimony Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
  <button
    onClick={onMemberLoginClick}
    className="text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition"
  >
    Member Login / Signup
  </button>

  <button
    onClick={onAdminLoginClick}
    className="text-xs md:text-sm font-medium px-3 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-sm transition"
  >
    Partner / Admin Login
  </button>
</div>

        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-800 to-rose-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent)]" />
        <div className="max-w-6xl mx-auto px-4 py-16 relative z-10 flex flex-col items-center text-center text-white">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-[0.2em] mb-4">
            <Heart size={14} className="text-rose-300" />
            Trusted Community Connections
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Find Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-200 to-amber-200">
              Humsafar
            </span>
          </h1>
          <p className="text-indigo-100 max-w-2xl mb-8 text-sm md:text-base">
            {APP_TAGLINE} — Discover handpicked profiles from trusted WhatsApp
            groups, curated with care for serious, meaningful relationships.
          </p>

          {/* SEARCH BAR CARD */}
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur rounded-2xl shadow-xl shadow-indigo-900/20 p-3 md:p-4 flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3">
              <span className="text-slate-400 text-xs font-medium uppercase">
                Search
              </span>
              <input
                className="flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Search by name, profession, city or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-200 outline-none"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="All">All Profiles</option>
                <option value="Female">Brides</option>
                <option value="Male">Grooms</option>
              </select>

              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-rose-500/30 hover:shadow-lg hover:scale-[1.02] transition"
              >
                {loading ? "Loading..." : `View ${filtered.length} Profiles`}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PROFILES SECTION */}
      <section className="max-w-6xl mx-auto px-4 pb-16 pt-6">
        {/* small heading */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Featured Profiles
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filtered.length} of {profiles.length} profiles
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-9 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                {/* Top band */}
                <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />

                <div className="p-4">
                  {/* Header: avatar + name + tag */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold shadow-md shadow-rose-500/40">
                        {renderInitial(p.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 leading-tight">
                          {p.name || "—"}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.age && `${p.age} yrs`}{" "}
                          {p.height && `• ${p.height}`}{" "}
                          {p.gender && `• ${p.gender}`}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {p.groupName || "Humsafar"}
                    </span>
                  </div>

                  {/* Profile no (small) */}
                  {p.globalProfileNo && (
                    <p className="text-[11px] text-slate-400 mb-2">
                      Profile No: {p.globalProfileNo}
                    </p>
                  )}

                  {/* Body details */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={13} className="text-slate-400" />
                      <span className="truncate">
                        {p.profession || "Profession not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="truncate">
                        {p.city ||
                          p.pob ||
                          p.address ||
                          "Location not specified"}
                      </span>
                    </div>
                    {p.income && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                        <span>💰</span>
                        <span>{p.income}</span>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedProfile(p)}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-rose-500 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Phone size={14} />
                      View Full Details
                    </button>

                    {p.globalProfileNo && (
                      <button
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/p/${p.globalProfileNo}`;

                          navigator.clipboard.writeText(shareUrl);
                          alert("Profile link copied!");
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <Share2 size={13} />
                        Share Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="col-span-3 text-center text-slate-400 py-20">
                No matching profiles found. Try changing filters.
              </div>
            )}
          </div>
        )}
      </section>

      {/* FULL PROFILE POPUP */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl mx-3 rounded-2xl shadow-2xl shadow-slate-900/40 relative max-h-[90vh] overflow-y-auto">
            {/* top gradient line */}
            <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />
            {/* Close */}
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xl"
              onClick={() => setSelectedProfile(null)}
            >
              ✕
            </button>

            <div className="p-5 md:p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-rose-500/40">
                  {renderInitial(selectedProfile.name)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                    {selectedProfile.name}
                  </h2>

                  <p className="text-xs text-slate-500 mb-1">
                    {selectedProfile.age && `${selectedProfile.age} yrs`}{" "}
                    {selectedProfile.gender && `• ${selectedProfile.gender}`}{" "}
                    {selectedProfile.height && `• ${selectedProfile.height}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {selectedProfile.globalProfileNo && (
                      <span className="px-2 py-1 rounded-full bg-slate-100">
                        Profile No: {selectedProfile.globalProfileNo}
                      </span>
                    )}
                    {selectedProfile.groupProfileNo && (
                      <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Group: {selectedProfile.groupProfileNo}
                      </span>
                    )}
                    {selectedProfile.groupName && (
                      <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                        {selectedProfile.groupName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 mb-4">
                {/* Left column */}
                <div className="space-y-2">
                  <Field label="Education" value={selectedProfile.education} />
                  <Field label="Profession" value={selectedProfile.profession} />
                  <Field label="Company / Business" value={selectedProfile.company} />
                  <Field label="Income" value={selectedProfile.income} />
                  <Field label="Diet" value={selectedProfile.diet} />
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

                {/* Right column */}
                <div className="space-y-2">
                  <Field label="DOB" value={selectedProfile.dob} />
                  <Field label="Birth Time" value={selectedProfile.tob} />
                  <Field label="Birth Place" value={selectedProfile.pob} />
                  <Field label="Manglik" value={selectedProfile.manglik} />
                  <Field
                    label="City"
                    value={
                      selectedProfile.city ||
                      selectedProfile.pob ||
                      selectedProfile.address
                    }
                  />
                  <Field label="Address" value={selectedProfile.address} />
                </div>
              </div>

              {/* Family & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
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
                <div className="space-y-2">
                  <Field
                    label="Contact"
                    value="Contact number is shared only with verified partners. Please connect via your group admin."
                    mono
                  />
                  {selectedProfile.globalProfileNo && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/p/${selectedProfile.globalProfileNo}`;
                          navigator.clipboard.writeText(shareUrl);
                          alert("Profile link copied!");
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <Share2 size={15} />
                        Share Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small helper for labelled rows
const Field = ({ label, value, extra, mono }) => {
  if (!value && !extra) return null;
  return (
    <div>
      <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-[0.12em] mb-0.5">
        {label}
      </p>
      <p className={`${mono ? "font-mono" : ""} text-slate-800`}>
        {value || "—"}
      </p>
      {extra && (
        <p className="text-xs text-slate-500 mt-0.5">
          {extra}
        </p>
      )}
    </div>
  );
};
