// src/components/PublicHome.jsx
import React, { useState, useEffect } from "react";
import { Heart, MapPin, Briefcase, Phone, Share2, Loader2 } from "lucide-react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs 
} from "firebase/firestore";
import { db } from "../firebase";

const APP_NAME = "Humsafar";
const APP_TAGLINE = "Rishtey wahi, jo dil se judey.";
const PAGE_SIZE = 9; // Grid of 3x3 looks nice

export default function PublicHome({ onAdminLoginClick, onMemberLoginClick }) {
  // DATA STATE
  const [profiles, setProfiles] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Bookmark for pagination
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // UI / FILTER STATE
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [selectedProfile, setSelectedProfile] = useState(null);

  // --- PAGINATION FETCH LOGIC ---
  const fetchProfiles = async (isNextPage = false) => {
    if (!db) return;

    try {
      if (isNextPage) setLoadingMore(true);
      else setLoading(true);

      let q;

      if (isNextPage && lastDoc) {
        // Load NEXT batch starting after the bookmark
        q = query(
          collection(db, "profiles"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        // Load FIRST batch
        q = query(
          collection(db, "profiles"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const newProfiles = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (isNextPage) {
        // Append to existing list
        setProfiles((prev) => [...prev, ...newProfiles]);
      } else {
        // Replace list (initial load)
        setProfiles(newProfiles);
      }

      // If we got fewer docs than requested, we reached the end
      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

    } catch (e) {
      console.error("Error fetching profiles:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchProfiles(false);
  }, []);

  // Client-side filtering of the *loaded* profiles
  // Note: Deep filtering + pagination requires complex server indexes.
  const filtered = profiles.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.profession?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term);

    const matchesGender = filterGender === "All" || p.gender === filterGender;

    return matchesSearch && matchesGender;
  });

  const renderInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

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
              <span className="text-[11px] text-slate-500 uppercase hidden md:inline">
                Premium Matrimony Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMemberLoginClick}
              className="text-xs md:text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition"
            >
              Member Login
            </button>
            <button
              onClick={onAdminLoginClick}
              className="hidden md:inline-block text-xs md:text-sm font-medium px-3 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition"
            >
              Partner Login
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative bg-indigo-900 pt-10 pb-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-rose-900 opacity-90" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Find Your <span className="text-rose-300">Humsafar</span>
          </h1>
          <p className="text-indigo-100 mb-8">{APP_TAGLINE}</p>

          {/* Search Card */}
          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2">
            <input 
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Search by Name, City, or Profession..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="px-4 py-3 rounded-xl bg-slate-50 text-slate-800 outline-none border-l border-slate-200"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="All">All Profiles</option>
              <option value="Female">Brides</option>
              <option value="Male">Grooms</option>
            </select>
          </div>
        </div>
      </section>

      {/* PROFILES GRID */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-20 pb-16">
        
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm min-h-[200px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-rose-500" size={32} />
              <p className="text-slate-500 text-sm">Finding matches...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-indigo-100 flex items-center justify-center text-indigo-700 text-lg font-bold border border-indigo-200">
                          {renderInitial(p.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{p.name || "—"}</h3>
                          <p className="text-xs text-slate-500">
                            {p.age ? `${p.age} yrs` : ""} 
                            {p.height ? ` • ${p.height}` : ""} 
                            {p.city ? ` • ${p.city}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-xs text-slate-600 mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-slate-400" />
                        <span className="truncate">{p.profession || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate">{p.city || p.pob || "Location N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-semibold">₹</span>
                        <span>{p.income || "Hidden"}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedProfile(p)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-rose-100 text-rose-600 bg-rose-50/50 hover:bg-rose-100 text-xs font-semibold transition"
                      >
                        <Phone size={14} /> View Contact
                      </button>
                      
                      {p.globalProfileNo && (
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/p/${p.globalProfileNo}`;
                            navigator.clipboard.writeText(url);
                            alert("Link copied!");
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 text-xs font-semibold transition"
                        >
                          <Share2 size={14} /> Share
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- PAGINATION CONTROLS --- */}
            <div className="mt-8 text-center pb-10">
              {filtered.length === 0 && !loading && (
                <p className="text-slate-500 text-sm">No profiles found matching your search.</p>
              )}

              {hasMore && (
                <button
                  onClick={() => fetchProfiles(true)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 mx-auto"
                >
                  {loadingMore && <Loader2 className="animate-spin" size={14} />}
                  {loadingMore ? "Loading..." : "Load More Profiles"}
                </button>
              )}
              
              {!hasMore && filtered.length > 0 && (
                <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest">
                  End of List
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* FULL PROFILE POPUP */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
             <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />
             <button 
               className="absolute top-3 right-3 p-2 bg-slate-100 rounded-full hover:bg-slate-200"
               onClick={() => setSelectedProfile(null)}
             >✕</button>
             
             <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedProfile.name}</h2>
                <p className="text-slate-500 text-sm mb-4">
                  {selectedProfile.age ? `${selectedProfile.age} yrs` : ""} 
                  {selectedProfile.gender ? ` • ${selectedProfile.gender}` : ""}
                </p>

                <div className="space-y-2 text-sm text-slate-700">
                   <p><strong>Education:</strong> {selectedProfile.education || "—"}</p>
                   <p><strong>Profession:</strong> {selectedProfile.profession || "—"}</p>
                   <p><strong>City:</strong> {selectedProfile.city || "—"}</p>
                   <p><strong>Father:</strong> {selectedProfile.father || "—"}</p>
                   
                   <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-6">
                      <p className="text-xs text-amber-800 font-bold uppercase mb-1 flex items-center gap-1">
                        <Phone size={12} /> Contact Information
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        To protect privacy and prevent spam, mobile numbers are only visible to authorized Group Admins. 
                        Please contact the admin of <strong>{selectedProfile.groupName || "this group"}</strong> to express interest.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}