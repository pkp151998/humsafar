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
import Input from "./input";




const GroupAdminDashboard = ({ user, onLogout }) => {
  const [profiles, setProfiles] = useState([]);
  const [view, setView] = useState('list');
  const [rawText, setRawText] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);


 useEffect(() => {
  const fetchProfiles = async () => {
    if (!db) return;

    console.log("GroupAdminDashboard: current user.groupName =", user.groupName);

    try {
      const q = query(
        collection(db, "profiles"),
        where("groupName", "==", user.groupName),
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Profiles fetched for this admin", data);
      setProfiles(data);
    } catch (e) {
      console.error("Error fetching profiles:", e);
      alert("Error fetching profiles: " + e.message);
    }
  };
  fetchProfiles();
}, [view, user.groupName]);

const handleParse = () => {
    if (!rawText.trim()) return;
    const data = parseBiodataHybrid(rawText);
    setFormData(data);
    setView('review');
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "profiles"), { ...formData, groupName: user.groupName, addedBy: user.username, createdAt: new Date().toISOString() });
      setRawText('');
      setView('list');
    } catch (e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this profile?')) {
      await deleteDoc(doc(db, "profiles", id));
      setProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const handleChange = (field, val) => setFormData({ ...formData, [field]: val });

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      <div className="bg-indigo-900 text-white w-full md:w-64 flex-shrink-0 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">{user.groupName}</h2>
          <p className="text-xs text-indigo-300 mb-8">Admin Dashboard</p>
          <nav className="space-y-2">
            <button onClick={() => setView('list')} className={`w-full text-left px-4 py-2 rounded-lg ${view === 'list' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>My Profiles</button>
            <button onClick={() => setView('add')} className={`w-full text-left px-4 py-2 rounded-lg ${view === 'add' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Add New</button>
          </nav>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors"><LogOut size={16} /> Logout</button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto h-screen">
        {view === 'list' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">My Profiles</h1>
              <button onClick={() => setView('add')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2"><PlusCircle size={18} /> Add New</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {profiles.map(p => (
                <div
                  key={p.id}
                  className="p-4 border-b flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedProfile(p);   // store clicked profile
                    setView('detail');       // switch to detail view
                  }}
                >
                  <div>
                    <div className="font-bold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.profession} • {p.city || p.pob}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();   // don't trigger row click
                      handleDelete(p.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {profiles.length === 0 && <div className="p-8 text-center text-gray-400">No profiles yet.</div>}
            </div>
          </div>
        )}
        {view === 'add' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Paste WhatsApp Biodata</h2>
            <textarea className="w-full h-48 p-4 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono mb-4" value={rawText} onChange={e => setRawText(e.target.value)} />
            <button onClick={handleParse} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full">Parse Data</button>
          </div>
        )}
        {view === 'review' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Input label="Name" val={formData.name} onChange={v => handleChange('name', v)} />
              <Input label="Age" val={formData.age} onChange={v => handleChange('age', v)} />
              <Input label="Gender" val={formData.gender} onChange={v => handleChange('gender', v)} />
              <Input label="Profession" val={formData.profession} onChange={v => handleChange('profession', v)} full />
              <Input label="Income" val={formData.income} onChange={v => handleChange('income', v)} />
              <Input label="City" val={formData.pob} onChange={v => handleChange('pob', v)} />
              <Input label="Contact" val={formData.contact} onChange={v => handleChange('contact', v)} full />
            </div>
            <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold w-full">{loading ? "Saving..." : "Publish"}</button>
          </div>
        )}
        {view === 'detail' && selectedProfile && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm">
            <button
              onClick={() => {
                setView('list');
                setSelectedProfile(null);
              }}
              className="text-xs mb-4 text-indigo-600 hover:underline"
            >
              ← Back to My Profiles
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedProfile.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {selectedProfile.age && `${selectedProfile.age} yrs`}
              {selectedProfile.gender && ` • ${selectedProfile.gender}`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold">Profession</div>
                <div>{selectedProfile.profession || '—'}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold">Income</div>
                <div>{selectedProfile.income || '—'}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold">City</div>
                <div>{selectedProfile.city || selectedProfile.pob || selectedProfile.address || '—'}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold">Height</div>
                <div>{selectedProfile.height || '—'}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold">Caste / Gotra</div>
                <div>
                  {selectedProfile.caste || '—'}
                  {selectedProfile.gotra ? ` • ${selectedProfile.gotra}` : ''}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold">Manglik</div>
                <div>{selectedProfile.manglik || '—'}</div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-[10px] uppercase text-gray-400 font-bold">Contact</div>
                <div className="font-mono text-base">
                  {selectedProfile.contact || '—'}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-[10px] uppercase text-gray-400 font-bold">Address</div>
                <div>{selectedProfile.address || '—'}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GroupAdminDashboard;