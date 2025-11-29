import React, { useState, useEffect } from 'react';
import { 
  Users, Link, MessageCircle, ExternalLink, 
  CheckCircle, MapPin, Briefcase, Calendar, 
  User, Home, Ruler, Clock, Phone, Trash2,
  Palette, Utensils, Users2, DollarSign, LogOut, Lock, PlusCircle, Search, Menu, X, Heart
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// --- ⚠️ CRITICAL: PASTE YOUR FIREBASE KEYS HERE ⚠️ ---
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
  console.error("Firebase keys missing. App running in offline mode.");
}

// --- APP BRANDING ---
const APP_NAME = "Humsafar";
const APP_TAGLINE = "Rishtey wahi, jo dil se judey."; 
const ADMIN_USERNAME = "admin"; 
const ADMIN_PASSWORD = "123";

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
  if (!data.height) { const htMatch = text.match(/(\d{1})['’\.\s-]*(\d{1,2})(?:['"”])/); if (htMatch && ['4','5','6'].includes(htMatch[1])) data.height = `${htMatch[1]}'${htMatch[2]}`; }
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

// --- COMPONENTS: PUBLIC SIDE ---

const PublicNavbar = ({ onLoginClick }) => (
  <nav className="bg-white shadow-sm sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
           <div className="bg-rose-600 p-1.5 rounded-lg text-white"><Heart size={20} fill="white" /></div>
           <div>
             <span className="font-bold text-xl text-gray-800 tracking-tight block leading-none">{APP_NAME}</span>
             <span className="text-[10px] text-gray-400 font-medium tracking-wide">MATCHMAKING</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={onLoginClick} className="text-sm font-medium text-gray-500 hover:text-rose-600 transition-colors">
             Admin Login
           </button>
           <button className="bg-rose-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-rose-700 transition-all">
             Contact Us
           </button>
        </div>
      </div>
    </div>
  </nav>
);

const PublicHome = ({ profiles, onLoginClick, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('All');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900"></div>
           <p className="text-gray-500 font-medium">Loading {APP_NAME}...</p>
        </div>
      </div>
    );
  }

  const filtered = profiles.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.pob?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'All' || p.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <PublicNavbar onLoginClick={onLoginClick} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white py-16 px-4 text-center">
         <h1 className="text-4xl font-extrabold mb-4">Find Your <span className="text-yellow-400">Humsafar</span></h1>
         <p className="text-indigo-100 mb-8 max-w-xl mx-auto text-lg">{APP_TAGLINE}</p>
         
         <div className="max-w-2xl mx-auto bg-white p-2 rounded-xl shadow-lg flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-3 text-gray-400" size={20} />
               <input 
                 className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 outline-none" 
                 placeholder="Search by Profession, City, or Name..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <select 
              className="px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium outline-none border-r-8 border-transparent"
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
            >
              <option value="All">All Profiles</option>
              <option value="Female">Brides</option>
              <option value="Male">Grooms</option>
            </select>
         </div>
      </div>

      {/* Directory Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-bold text-gray-800">Latest Rishtey</h2>
           <span className="text-gray-500 text-sm font-medium">{filtered.length} profiles found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filtered.map(p => (
             <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                   <div className="absolute -bottom-8 left-4">
                      <div className="w-16 h-16 bg-white rounded-full p-1 shadow-md">
                         <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl ${p.gender === 'Female' ? 'bg-pink-500' : 'bg-blue-600'}`}>
                            {p.gender === 'Female' ? 'F' : 'M'}
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="pt-10 px-4 pb-4">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                        <p className="text-xs text-gray-500">{p.age} Yrs • {p.height}</p>
                      </div>
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">{p.caste || 'General'}</span>
                   </div>
                   
                   <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Briefcase size={16} className="text-rose-500" />
                         <span className="truncate">{p.profession} {p.income ? `(${p.income})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                         <MapPin size={16} className="text-rose-500" />
                         <span className="truncate">{p.pob || p.address || 'Location N/A'}</span>
                      </div>
                      {p.manglik && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                           <Calendar size={16} className="text-rose-500" />
                           <span>{p.manglik}</span>
                        </div>
                      )}
                   </div>

                   <button className="w-full mt-6 border border-rose-600 text-rose-600 font-bold py-2 rounded-lg hover:bg-rose-50 transition-colors text-sm">
                      View Full Profile
                   </button>
                </div>
             </div>
           ))}
        </div>
        
        {filtered.length === 0 && (
           <div className="text-center py-20">
              <p className="text-gray-400">No profiles found.</p>
           </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTS: ADMIN SIDE ---

const AdminLogin = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
       onLogin();
    } else {
       setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
          <div className="text-center mb-6">
             <h2 className="text-2xl font-bold text-gray-800">Admin Portal</h2>
             <p className="text-sm text-gray-500">Sign in to manage {APP_NAME}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
             <input className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
             <input className="w-full p-3 border rounded-lg outline-none focus:border-indigo-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
             <button className="w-full bg-indigo-900 text-white font-bold py-3 rounded-xl hover:bg-indigo-800">Login</button>
          </form>
          <button onClick={onBack} className="w-full text-center text-sm text-gray-500 mt-4 hover:underline">Back to Website</button>
       </div>
    </div>
  );
};

const AdminDashboard = ({ onLogout }) => {
  const [profiles, setProfiles] = useState([]);
  const [view, setView] = useState('list'); 
  const [rawText, setRawText] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      if(!db) return;
      const q = query(collection(db, "profiles"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProfiles(data);
    };
    fetchProfiles();
  }, [view]);

  const handleParse = () => {
    if(!rawText.trim()) return;
    const data = parseBiodataHybrid(rawText);
    setFormData(data);
    setView('review');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        if(!db) throw new Error("Firebase not connected");
        await addDoc(collection(db, "profiles"), {
            ...formData,
            createdAt: new Date().toISOString()
        });
        setRawText('');
        setView('list');
    } catch (e) {
        alert("Error saving: " + e.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this profile?')) {
       try {
         await deleteDoc(doc(db, "profiles", id));
         setProfiles(profiles.filter(p => p.id !== id));
       } catch (e) {
         alert("Error deleting: " + e.message);
       }
    }
  };

  const handleChange = (field, val) => setFormData({...formData, [field]: val});

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
       <div className="bg-indigo-900 text-white w-full md:w-64 flex-shrink-0 p-6 flex flex-col justify-between">
          <div>
             <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><Lock size={20}/> {APP_NAME}</h2>
             <nav className="space-y-2">
                <button onClick={() => setView('list')} className={`w-full text-left px-4 py-2 rounded-lg ${view === 'list' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Dashboard</button>
                <button onClick={() => setView('add')} className={`w-full text-left px-4 py-2 rounded-lg ${view === 'add' || view === 'review' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Add Profile</button>
             </nav>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors"><LogOut size={16}/> Logout</button>
       </div>

       <div className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
          {view === 'list' && (
             <div>
                <div className="flex justify-between items-center mb-6">
                   <h1 className="text-2xl font-bold text-gray-800">Managed Profiles</h1>
                   <button onClick={() => setView('add')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2"><PlusCircle size={18}/> Add New</button>
                </div>
                
                {!db && (
                   <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 text-sm font-bold border border-red-200">
                      ⚠️ Database not connected! Please paste your Firebase Keys in App.js.
                   </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200">
                         <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Details</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody>
                         {profiles.map(p => (
                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                               <td className="p-4 font-bold text-gray-800">{p.name}</td>
                               <td className="p-4 text-sm text-gray-600">{p.age} Yrs • {p.profession}</td>
                               <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span></td>
                               <td className="p-4 text-right"><button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button></td>
                            </tr>
                         ))}
                         {profiles.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">No profiles found.</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {view === 'add' && (
             <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Profile</h2>
                <textarea 
                  className="w-full h-48 p-4 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono mb-4"
                  placeholder="Paste WhatsApp Biodata here..."
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                />
                <button onClick={handleParse} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full">Parse Data</button>
             </div>
          )}

          {view === 'review' && (
             <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Review Data</h2>
                   <button onClick={() => setView('add')} className="text-red-500 text-sm">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <Input label="Name" val={formData.name} onChange={v => handleChange('name', v)} />
                   <Input label="Age" val={formData.age} onChange={v => handleChange('age', v)} />
                   <Input label="Gender" val={formData.gender} onChange={v => handleChange('gender', v)} />
                   <Input label="Profession" val={formData.profession} onChange={v => handleChange('profession', v)} full />
                   <Input label="Income" val={formData.income} onChange={v => handleChange('income', v)} />
                   <Input label="City" val={formData.pob} onChange={v => handleChange('pob', v)} />
                   <Input label="Contact" val={formData.contact} onChange={v => handleChange('contact', v)} full />
                </div>
                <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold w-full">
                   {loading ? "Saving to Cloud..." : "Publish to Humsafar"}
                </button>
             </div>
          )}
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
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchProfiles = async () => {
        if(!db) {
            setLoading(false);
            return;
        }
        try {
            const q = query(collection(db, "profiles"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProfiles(data);
        } catch(e) {
            console.error("Error loading profiles:", e);
        }
        setLoading(false);
     };
     fetchProfiles();
  }, [view]);

  const handleLogin = () => setView('admin');
  const handleLogout = () => setView('public');

  return (
    <div>
      {view === 'public' && <PublicHome profiles={profiles} onLoginClick={() => setView('login')} loading={loading} />}
      {view === 'login' && <AdminLogin onLogin={handleLogin} onBack={() => setView('public')} />}
      {view === 'admin' && <AdminDashboard onLogout={handleLogout} />}
    </div>
  );
}
