import React, { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";



const SuperAdminDashboard = ({ user, onLogout }) => {
  const [admins, setAdmins] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    groupName: "",
  });
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
  if (!newAdmin.email || !newAdmin.password || !newAdmin.groupName) {
    return alert("Fill all fields");
  }

  if (!auth || !db) {
    alert("App is not connected to database.");
    return;
  }

  try {
    // 1) Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(
      auth,
      newAdmin.email,
      newAdmin.password
    );
    const uid = cred.user.uid;

    // 2) Create Admin metadata document (no password stored)
    await setDoc(doc(db, "admins", uid), {
      email: newAdmin.email,
      groupName: newAdmin.groupName,
      role: "group",
      createdAt: new Date().toISOString(),
    });

    alert("New Group Admin Created!");
    setNewAdmin({ email: "", password: "", groupName: "" });
    setShowAdd(false);
  } catch (e) {
    alert("Error: " + e.message);
  }
};


  const getProfileCount = (groupName) => profiles.filter(p => p.groupName === groupName).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-indigo-900">Super Admin HQ</h1><p className="text-gray-500">Overview of all WhatsApp Groups</p></div>
          <button onClick={onLogout} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold text-red-500">Logout</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <input
    className="border p-2 rounded"
    placeholder="Group Name"
    value={newAdmin.groupName}
    onChange={(e) =>
      setNewAdmin({ ...newAdmin, groupName: e.target.value })
    }
  />

  <input
    className="border p-2 rounded"
    placeholder="Admin Email"
    type="email"
    value={newAdmin.email}
    onChange={(e) =>
      setNewAdmin({ ...newAdmin, email: e.target.value })
    }
  />

  <input
    className="border p-2 rounded"
    placeholder="Temporary Password"
    type="password"
    value={newAdmin.password}
    onChange={(e) =>
      setNewAdmin({ ...newAdmin, password: e.target.value })
    }
  />
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
export default SuperAdminDashboard;