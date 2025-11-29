import React, { useState, useEffect } from 'react';
import {
  Users, Link, MessageCircle, ExternalLink,
  CheckCircle, MapPin, Briefcase, Calendar,
  User, Home, Ruler, Clock, Phone, Trash2,
  Palette, Utensils, Users2, DollarSign, LogOut, Lock, PlusCircle, Search, Menu, X, Heart, Shield, UserPlus, BarChart3
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

// --- ⚠️ PASTE YOUR FIREBASE KEYS HERE ⚠️ ---
const firebaseConfig = {
  apiKey: "AIzaSyB5gD4mjL3g6jASaDTSXauil1Dm7zHVn7c",
  authDomain: "myhumsafar-5b72d.firebaseapp.com",
  projectId: "myhumsafar-5b72d",
  storageBucket: "myhumsafar-5b72d.firebasestorage.app",
  messagingSenderId: "455231316018",
  appId: "1:455231316018:web:3296dde5d54c7ac0eedc2b"
};

// Initialize Firebase safely
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase keys missing.");
}

const APP_NAME = "Humsafar";
const APP_TAGLINE = "Rishtey wahi, jo dil se judey.";

// --- HELPER: AGE CALCULATOR ---
const calculateAge = (dobString) => {
  if (!dobString) return '';
  const cleanStr = dobString.replace(/(\d+)(st|nd|rd|th)/i, '$1').replace(/['"]/g, '').replace(/[-.]/g, '/');
  let birthDate = new Date(cleanStr);
  if (isNaN(birthDate.getTime())) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
  }
  if (isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age.toString();
};

// --- PARSER ENGINE ---
const parseBiodataHybrid = (text) => {
  const data = {
    name: '', gender: '', age: '', height: '', dob: '', tob: '', pob: '', address: '',
    caste: '', gotra: '', complexion: '', diet: '', education: '', profession: '', income: '', company: '',
    father: '', fatherOcc: '', mother: '', motherOcc: '', siblings: '', contact: '', manglik: ''
  };

  let cleanText = text
    .replace(/([a-z])(Name[:\-])/gi, '$1\n$2')
    .replace(/([a-z])(DOB[:\-])/gi, '$1\n$2')
    .replace(/([a-z])(Contact[:\-])/gi, '$1\n$2');
  const lines = cleanText.split(/\n/).map(l => l.trim()).filter(Boolean);
  const getValue = (patterns, excludeKeywords = []) => {
    for (let line of lines) {
      if (excludeKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) continue;
      for (let pattern of patterns) {
        const regex = new RegExp(`${pattern}\\s*[:\\-]+\\s*(.*)`, 'i');
        const match = line.match(regex);
        if (match && match[1]) return match[1].split(/,|\n/)[0].trim();
      }
    }
    return '';
  };

  data.name = getValue(['Name', 'Full Name'], ['Father', 'Mother']);
  data.gender = getValue(['Gender', 'Sex']);
  data.height = getValue(['Height', 'Ht']);
  data.complexion = getValue(['Color', 'Complexion', 'Skin Tone']);
  data.diet = getValue(['Diet', 'Food']);
  data.dob = getValue(['Date of Birth', 'DOB']);
  data.tob = getValue(['Birth Time', 'Time of Birth', 'TOB', 'Time']);
  data.pob = getValue(['Birth Place', 'Place of Birth', 'POB']);
  data.caste = getValue(['Caste']);
  data.gotra = getValue(['Gotra']);
  data.education = getValue(['Qualification', 'Education', 'Degree']);
  data.profession = getValue(['Profession', 'Occupation', 'Job'], ['Father', 'Mother']);
  data.company = getValue(['Company', 'Working at', 'Working in']);
  data.income = getValue(['Package', 'Income', 'Salary', 'CTC', 'LPA']);
  data.address = getValue(['Present Address', 'Address', 'Residence', 'Residing']);
  data.contact = getValue(['Mob', 'Mobile', 'Contact', 'Phone']);

  lines.forEach(line => {
    const l = line.toLowerCase();
    if (l.includes('father') && (l.includes('name') || !l.includes('occupation'))) { if (!data.father) data.father = line.split(/[:\-]/)[1]?.trim(); }
    if (l.includes('mother') && (l.includes('name') || !l.includes('occupation'))) { if (!data.mother) data.mother = line.split(/[:\-]/)[1]?.trim(); }
    if (l.includes("father") && (l.includes("occupation") || l.includes("job") || l.includes("working"))) { data.fatherOcc = line.split(/[:\-]/)[1]?.trim(); }
    if (l.includes("mother") && (l.includes("occupation") || l.includes("job") || l.includes("housewife"))) { data.motherOcc = line.split(/[:\-]/)[1]?.trim(); }
    if (l.includes('sibling') || l.includes('brother') || l.includes('sister')) { data.siblings = line.split(/[:\-]/)[1]?.trim(); }
  });

  if (!data.gender) {
    if (/\b(boy|male|groom|he)\b/i.test(text)) data.gender = 'Male';
    else if (/\b(girl|female|bride|she)\b/i.test(text)) data.gender = 'Female';
  }
  if (/non[\s-]?manglik/i.test(text)) data.manglik = 'Non-Manglik';
  else if (/anshik/i.test(text)) data.manglik = 'Anshik';
  else if (/manglik/i.test(text)) data.manglik = 'Manglik';
  if (!data.height) { const htMatch = text.match(/(\d{1})['’\.\s-]*(\d{1,2})(?:['"”])/); if (htMatch && ['4', '5', '6'].includes(htMatch[1])) data.height = `${htMatch[1]}'${htMatch[2]}`; }
  if (!data.income) { const incMatch = text.match(/(\d+\.?\d*)\s*(LPA|Lac|Lakhs|CTC)/i); if (incMatch) data.income = incMatch[0]; }
  if (!data.contact) { const phoneMatch = text.match(/(\+91|0)?\s?(\d{5}\s?\d{5}|\d{10})/); if (phoneMatch) data.contact = phoneMatch[0]; }

  if (data.name) {
    let cleanName = data.name.replace(/^(CA|Er|Dr|Mr|Ms|Mrs)\.?\s+/i, '');
    cleanName = cleanName.replace(/\(.*\)/, '').trim();
    data.name = cleanName;
  } else if (lines[0] && lines[0].length < 30) {
    data.name = lines[0].replace(/biodata/i, '').trim();
  }
  if (data.dob) { const calcAge = calculateAge(data.dob); if (calcAge) data.age = calcAge; }
  return data;
};

// --- COMPONENTS ---

const LoginScreen = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Check Super Admin
    if (username === 'master' && password === 'soulbind') {
      onLogin({ role: 'super', username: 'Super Admin', groupName: 'Humsafar HQ' });
      setLoading(false);
      return;
    }

    // 2. Check Group Admins
    if (!db) { setError("Database not connected"); setLoading(false); return; }

    try {
      const q = query(collection(db, "admins"), where("username", "==", username));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        if (userData.password === password) {
          onLogin({ role: 'group', ...userData, id: snapshot.docs[0].id });
        } else {
          setError("Incorrect Password");
        }
      } else {
        setError("User not found");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-900 rounded-full flex items-center justify-center text-white mx-auto mb-3">
            <Lock size={20} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Partner Login</h2>
          <p className="text-sm text-gray-500">Sign in to manage your group</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          <button disabled={loading} className="w-full bg-indigo-900 text-white font-bold py-3 rounded-xl hover:bg-indigo-800 disabled:bg-gray-400">
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
        <button onClick={onBack} className="w-full text-center text-sm text-gray-500 mt-4 hover:underline">Back to Website</button>
      </div>
    </div>
  );
};

// --- SUPER ADMIN DASHBOARD ---
const SuperAdminDashboard = ({ user, onLogout }) => {
  const [admins, setAdmins] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', groupName: '' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!db) return;
      const adminSnap = await getDocs(collection(db, "admins"));
      setAdmins(adminSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const profileSnap = await getDocs(collection(db, "profiles"));
      setProfiles(profileSnap.docs.map(d => d.data()));
    };
    fetchData();
  }, [showAdd]);

  const handleCreateAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password || !newAdmin.groupName) return alert("Fill all fields");
    try {
      await addDoc(collection(db, "admins"), { ...newAdmin, createdAt: new Date().toISOString() });
      alert("New Group Admin Created!");
      setNewAdmin({ username: '', password: '', groupName: '' });
      setShowAdd(false);
    } catch (e) { alert("Error: " + e.message); }
  };

  const getProfileCount = (groupName) => profiles.filter(p => p.groupName === groupName).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-indigo-900">Super Admin HQ</h1><p className="text-gray-500">Overview of all WhatsApp Groups</p></div>
          <button onClick={onLogout} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold text-red-500">Logout</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100"><div className="text-gray-500 text-sm font-bold uppercase mb-1">Total Groups</div><div className="text-3xl font-bold text-indigo-900">{admins.length}</div></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100"><div className="text-gray-500 text-sm font-bold uppercase mb-1">Total Profiles</div><div className="text-3xl font-bold text-indigo-900">{profiles.length}</div></div>
          <div className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white cursor-pointer hover:bg-indigo-700" onClick={() => setShowAdd(!showAdd)}><div className="flex items-center gap-2 font-bold mb-1"><UserPlus size={20} /> Create Admin</div><div className="text-indigo-200 text-sm">Add a new Manager</div></div>
        </div>
        {showAdd && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-indigo-200">
            <h3 className="font-bold text-lg mb-4">Create New Group Admin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="border p-2 rounded" placeholder="Group Name" value={newAdmin.groupName} onChange={e => setNewAdmin({ ...newAdmin, groupName: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Username" value={newAdmin.username} onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
            </div>
            <button onClick={handleCreateAdmin} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-bold w-full md:w-auto">Create Account</button>
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Group Admins</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b"><tr><th className="p-4 text-xs font-bold text-gray-500 uppercase">Group Name</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Username</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Password</th><th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Profiles Added</th></tr></thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-800">{admin.groupName}</td>
                  <td className="p-4 text-gray-600">{admin.username}</td>
                  <td className="p-4 font-mono text-gray-400">{admin.password}</td>
                  <td className="p-4 text-right"><span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">{getProfileCount(admin.groupName)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- GROUP ADMIN DASHBOARD ---
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

const Input = ({ label, val, onChange, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</label>
    <input className="w-full border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500" value={val || ''} onChange={e => onChange(e.target.value)} />
  </div>
);

// --- MAIN ROUTER ---
export default function App() {
  const [view, setView] = useState('public');
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!db) { setLoading(false); return; }
      try {
        const q = query(collection(db, "profiles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        setProfiles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchProfiles();
  }, [view]);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'super') setView('superAdmin');
    else setView('groupAdmin');
  };

  const handleLogout = () => { setUser(null); setView('public'); };

  return (
    <div>
      {view === 'public' && <PublicHome profiles={profiles} onLoginClick={() => setView('login')} loading={loading} />}
      {view === 'login' && <LoginScreen onLogin={handleLogin} onBack={() => setView('public')} />}
      {view === 'superAdmin' && <SuperAdminDashboard user={user} onLogout={handleLogout} />}
      {view === 'groupAdmin' && <GroupAdminDashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}
