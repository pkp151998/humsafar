import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function ProfilePage() {
  const { id } = useParams(); // globalProfileNo
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, "profiles"),
        where("globalProfileNo", "==", id)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        setProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    };
    load();
  }, [id]);

  if (!profile)
    return <div className="p-6 text-center">Loading profile…</div>;

  return (
    <div className="max-w-xl mx-auto bg-white p-6 shadow rounded-xl mt-6">
      <h1 className="text-2xl font-bold mb-2">{profile.name}</h1>
      <p className="text-gray-500 mb-4">Profile No: {id}</p>

      <div className="space-y-3 text-sm">
        <p><b>Age:</b> {profile.age}</p>
        <p><b>Gender:</b> {profile.gender}</p>
        <p><b>Height:</b> {profile.height}</p>
        <p><b>DOB:</b> {profile.dob}</p>
        <p><b>Profession:</b> {profile.profession}</p>
        <p><b>Income:</b> {profile.income}</p>
        <p><b>City:</b> {profile.city}</p>
        <p><b>Address:</b> {profile.address}</p>
        <p><b>Contact:</b> Contact details are shared only with authorized partners.</p>

      </div>
    </div>
  );
}
