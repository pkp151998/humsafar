// src/components/PublicHome.jsx
import React, { useState } from "react";
import { Heart } from "lucide-react";

const APP_NAME = "Humsafar";
const APP_TAGLINE = "Rishtey wahi, jo dil se judey.";

export default function PublicHome({ profiles, onLoginClick, loading }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [selectedProfile, setSelectedProfile] = useState(null);

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.groupName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGender =
      filterGender === "All" || p.gender === filterGender;

    return matchesSearch && matchesGender;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-rose-600 p-1.5 rounded-lg text-white">
              <Heart size={20} fill="white" />
            </div>
            <span className="font-bold text-xl text-gray-800">
              {APP_NAME}
            </span>
          </div>

          <button
            onClick={onLoginClick}
            className="text-sm font-medium text-gray-500 hover:text-rose-600"
          >
            Admin Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Find Your Humsafar</h1>
        <p className="text-indigo-100 mb-8">{APP_TAGLINE}</p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto bg-white p-2 rounded-xl shadow-lg flex flex-col md:flex-row gap-2">
          <input
            className="flex-1 w-full pl-4 py-3 rounded-lg text-gray-800 outline-none"
            placeholder="Search by Group, Profession, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="px-4 py-3 bg-gray-100 text-gray-700 outline-none rounded-lg"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Female">Brides</option>
            <option value="Male">Grooms</option>
          </select>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {p.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {p.age && `${p.age} Yrs`}{" "}
                      {p.height && `• ${p.height}`}
                    </p>
                    {p.globalProfileNo && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Profile No: {p.globalProfileNo}
                      </p>
                    )}
                  </div>

                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded">
                    {p.groupName || "Humsafar"}
                  </span>
                </div>
              </div>

              <div className="p-4 text-sm text-gray-600 space-y-2">
                <div>💼 {p.profession || "—"}</div>
                <div>
                  📍{" "}
                  {p.city ||
                    p.pob ||
                    p.address ||
                    "—"}
                </div>

                {/* View full profile popup */}
                <button
                  onClick={() => setSelectedProfile(p)}
                  className="w-full mt-4 border border-rose-600 text-rose-600 font-bold py-2 rounded-lg"
                >
                  View Contact
                </button>

                {/* Share button on card (optional but nice) */}
                {p.globalProfileNo && (
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}?profile=${p.globalProfileNo}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("Profile link copied!");
                    }}
                    className="w-full mt-2 border border-indigo-600 text-indigo-600 font-semibold py-2 rounded-lg text-sm"
                  >
                    Share Profile
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-20">
              No profiles found
            </div>
          )}
        </div>
      </div>

      {/* FULL PROFILE POPUP */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              className="absolute top-2 right-3 text-gray-500 text-xl"
              onClick={() => setSelectedProfile(null)}
            >
              ✕
            </button>

            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {selectedProfile.name}
            </h2>

            {selectedProfile.globalProfileNo && (
              <p className="text-xs text-gray-500">
                Profile No: {selectedProfile.globalProfileNo}
              </p>
            )}
            {selectedProfile.groupProfileNo && (
              <p className="text-xs text-gray-400 mb-2">
                Group Profile: {selectedProfile.groupProfileNo}
              </p>
            )}

            <p className="text-sm text-gray-500 mb-4">
              {selectedProfile.age && `${selectedProfile.age} yrs`}{" "}
              {selectedProfile.gender && `• ${selectedProfile.gender}`}{" "}
              {selectedProfile.height && `• ${selectedProfile.height}`}
            </p>

            {/* Sections */}
            <div className="space-y-3 text-sm text-gray-700">
              {/* Education & Work */}
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Education
                </p>
                <p>{selectedProfile.education || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Profession
                </p>
                <p>{selectedProfile.profession || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Company / Business
                </p>
                <p>{selectedProfile.company || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Income
                </p>
                <p>{selectedProfile.income || "—"}</p>
              </div>

              {/* Astro / Personal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold">
                    DOB
                  </p>
                  <p>{selectedProfile.dob || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold">
                    Birth Time
                  </p>
                  <p>{selectedProfile.tob || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold">
                    Birth Place
                  </p>
                  <p>{selectedProfile.pob || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold">
                    Manglik
                  </p>
                  <p>{selectedProfile.manglik || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold">
                    Diet
                  </p>
                  <p>{selectedProfile.diet || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold">
                    Caste / Gotra
                  </p>
                  <p>
                    {selectedProfile.caste || "—"}
                    {selectedProfile.gotra
                      ? ` • ${selectedProfile.gotra}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  City
                </p>
                <p>
                  {selectedProfile.city ||
                    selectedProfile.pob ||
                    selectedProfile.address ||
                    "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Address
                </p>
                <p>{selectedProfile.address || "—"}</p>
              </div>

              {/* Family */}
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Father
                </p>
                <p>{selectedProfile.father || "—"}</p>
                <p className="text-xs text-gray-500">
                  {selectedProfile.fatherOcc}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Mother
                </p>
                <p>{selectedProfile.mother || "—"}</p>
                <p className="text-xs text-gray-500">
                  {selectedProfile.motherOcc}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Siblings
                </p>
                <p>{selectedProfile.siblings || "—"}</p>
              </div>

              {/* Contact */}
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  Contact
                </p>
                <p className="font-mono">
                  {selectedProfile.contact || "—"}
                </p>
              </div>

              {/* SHARE BUTTON in popup */}
              {selectedProfile.globalProfileNo && (
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}?profile=${selectedProfile.globalProfileNo}`;
                    navigator.clipboard.writeText(shareUrl);
                    alert("Profile link copied!");
                  }}
                  className="w-full mt-4 border border-indigo-600 text-indigo-600 font-bold py-2 rounded-lg"
                >
                  Share Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
