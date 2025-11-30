// src/components/GroupAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { PlusCircle, Trash2, LogOut } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { parseBiodataHybrid } from "../utils/parseBiodata";
import Input from "./Input";

export default function GroupAdminDashboard({ user, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [view, setView] = useState("list");
  const [rawText, setRawText] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // FETCH PROFILES FOR THIS GROUP
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!db) return;

      const q = query(
        collection(db, "profiles"),
        where("groupName", "==", user.groupName)
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProfiles(data);
    };
    fetchProfiles();
  }, [view, user.groupName]);

  // PARSE WHATSAPP BIODATA
  const handleParse = () => {
    if (!rawText.trim()) return;
    const data = parseBiodataHybrid(rawText);
    setFormData(data);
    setView("review");
  };

  // SAVE PROFILE with Global + Group Profile Numbers
  const handleSave = async () => {
    setLoading(true);
    try {
      // GLOBAL COUNT
      const allProfilesSnap = await getDocs(collection(db, "profiles"));
      const totalProfiles = allProfilesSnap.size + 1;
      const globalProfileNo = `HS-${String(totalProfiles).padStart(5, "0")}`;

      // GROUP COUNT
      const groupSnap = await getDocs(
        query(
          collection(db, "profiles"),
          where("groupName", "==", user.groupName)
        )
      );
      const groupCount = groupSnap.size + 1;
      const groupProfileNo = `${user.groupName}-${groupCount}`;

      await addDoc(collection(db, "profiles"), {
        ...formData,
        groupName: user.groupName,
        addedBy: user.username,
        createdAt: new Date().toISOString(),
        globalProfileNo,
        groupProfileNo,
      });

      setRawText("");
      setView("list");
    } catch (e) {
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

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      {/* LEFT SIDEBAR */}
      <div className="bg-indigo-900 text-white w-full md:w-64 flex-shrink-0 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">{user.groupName}</h2>
          <p className="text-xs text-indigo-300 mb-8">Admin Dashboard</p>

          <nav className="space-y-2">
            <button
              onClick={() => setView("list")}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                view === "list" ? "bg-indigo-800" : "hover:bg-indigo-800"
              }`}
            >
              My Profiles
            </button>

            <button
              onClick={() => setView("add")}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                view === "add" ? "bg-indigo-800" : "hover:bg-indigo-800"
              }`}
            >
              Add New
            </button>
          </nav>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto h-screen">
        {/* LIST VIEW */}
        {view === "list" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                My Profiles
              </h1>

              <button
                onClick={() => setView("add")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2"
              >
                <PlusCircle size={18} /> Add New
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="p-4 border-b flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedProfile(p);
                    setView("detail");
                  }}
                >
                  <div>
                    <div className="font-bold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.age && `${p.age} yrs`} {p.gender && `• ${p.gender}`}{" "}
                      {p.city && `• ${p.city}`}
                    </div>
                    {p.globalProfileNo && (
                      <div className="text-[10px] text-gray-400">
                        {p.globalProfileNo}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {profiles.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  No profiles yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD NEW */}
        {view === "add" && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Paste WhatsApp Biodata
            </h2>

            <textarea
              className="w-full h-48 p-4 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono mb-4"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            <button
              onClick={handleParse}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full"
            >
              Parse Data
            </button>
          </div>
        )}

        {/* REVIEW PANEL */}
        {view === "review" && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Review & Edit Profile
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Basic */}
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

              {/* Education & Work */}
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

              {/* Location */}
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

              {/* Caste / Gotra */}
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

              {/* Family */}
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

              {/* Contact */}
              <Input
                label="Contact"
                val={formData.contact}
                onChange={(v) => handleChange("contact", v)}
                full
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold w-full"
            >
              {loading ? "Saving..." : "Publish"}
            </button>
          </div>
        )}

        {/* DETAIL VIEW – SHOW FULL BIODATA */}
        {view === "detail" && selectedProfile && (
          <div className="max-w-3xl bg-white p-6 rounded-2xl shadow-sm">
            <button
              onClick={() => {
                setView("list");
                setSelectedProfile(null);
              }}
              className="text-xs mb-4 text-indigo-600 hover:underline"
            >
              ← Back to My Profiles
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              {/* Basic / Astro */}
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    DOB
                  </div>
                  <div>{selectedProfile.dob || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Birth Time
                  </div>
                  <div>{selectedProfile.tob || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Birth Place
                  </div>
                  <div>{selectedProfile.pob || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Manglik
                  </div>
                  <div>{selectedProfile.manglik || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Diet
                  </div>
                  <div>{selectedProfile.diet || "—"}</div>
                </div>
              </div>

              {/* Education & Work */}
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Education
                  </div>
                  <div>{selectedProfile.education || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Profession
                  </div>
                  <div>{selectedProfile.profession || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Company / Business
                  </div>
                  <div>{selectedProfile.company || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Income
                  </div>
                  <div>{selectedProfile.income || "—"}</div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    City
                  </div>
                  <div>
                    {selectedProfile.city ||
                      selectedProfile.pob ||
                      selectedProfile.address ||
                      "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Address
                  </div>
                  <div>{selectedProfile.address || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Caste / Gotra
                  </div>
                  <div>
                    {selectedProfile.caste || "—"}
                    {selectedProfile.gotra
                      ? ` • ${selectedProfile.gotra}`
                      : ""}
                  </div>
                </div>
              </div>

              {/* Family */}
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Father
                  </div>
                  <div>{selectedProfile.father || "—"}</div>
                  <div className="text-xs text-gray-500">
                    {selectedProfile.fatherOcc}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Mother
                  </div>
                  <div>{selectedProfile.mother || "—"}</div>
                  <div className="text-xs text-gray-500">
                    {selectedProfile.motherOcc}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Siblings
                  </div>
                  <div>{selectedProfile.siblings || "—"}</div>
                </div>
              </div>

              {/* Contact */}
              <div className="md:col-span-2 space-y-2">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    Contact
                  </div>
                  <div className="font-mono text-base">
                    {selectedProfile.contact || "—"}
                  </div>
                </div>
                <div className="text-[10px] text-gray-400">
                  Added by: {selectedProfile.addedBy || "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
