import React, { useState } from "react";
import { Heart } from "lucide-react";

const APP_NAME = "Humsafar";
const APP_TAGLINE = "Rishtey wahi, jo dil se judey.";


const PublicHome = ({ profiles, onLoginClick, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('All');

  const filtered = profiles.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.profession?.toLowerCase().includes(searchTerm.toLowerCase()) || p.groupName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'All' || p.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="bg-rose-600 p-1.5 rounded-lg text-white"><Heart size={20} fill="white" /></div><span className="font-bold text-xl text-gray-800">{APP_NAME}</span></div>
          <button onClick={onLoginClick} className="text-sm font-medium text-gray-500 hover:text-rose-600">Admin Login</button>
        </div>
      </nav>
      <div className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Find Your Humsafar</h1>
        <p className="text-indigo-100 mb-8">{APP_TAGLINE}</p>
        <div className="max-w-2xl mx-auto bg-white p-2 rounded-xl shadow-lg flex flex-col md:flex-row gap-2">
          <input className="flex-1 w-full pl-4 py-3 rounded-lg text-gray-800 outline-none" placeholder="Search by Group, Profession, City..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <select className="px-4 py-3 bg-gray-100 text-gray-700 outline-none" value={filterGender} onChange={e => setFilterGender(e.target.value)}><option value="All">All</option><option value="Female">Brides</option><option value="Male">Grooms</option></select>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 border-b"><div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-gray-900">{p.name}</h3><p className="text-xs text-gray-500">{p.age} Yrs • {p.height}</p></div><span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded">{p.groupName || 'Humsafar'}</span></div></div>
              <div className="p-4 text-sm text-gray-600 space-y-2"><div>💼 {p.profession}</div><div>📍 {p.pob || p.address}</div><button className="w-full mt-4 border border-rose-600 text-rose-600 font-bold py-2 rounded-lg">View Contact</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default PublicHome;