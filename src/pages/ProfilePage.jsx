// src/components/ProfilePage.jsx (modernised UI)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import {
  Heart,
  MapPin,
  Briefcase,
  Calendar,
  Phone,
  Users,
} from "lucide-react";

export default function ProfilePage() {
  const { id } = useParams(); // expected: globalProfileNo (e.g. HS-00023)
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!db || !id) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "profiles"),
          where("globalProfileNo", "==", id)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setProfile({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const renderInitial = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md px-6 py-4 text-sm text-slate-500">
          Loading profile…
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-5 max-w-sm text-center">
          <p className="text-base font-semibold text-slate-900 mb-1">
            Profile not found
          </p>
          <p className="text-sm text-slate-500 mb-4">
            This profile number does not exist or is no longer public.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Humsafar
          </button>
        </div>
      </div>
    );
  }

  const initial = renderInitial(profile.name);
  const profileNo = profile.globalProfileNo || id;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden relative">
        {/* top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />

        {/* back button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-3 left-3 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          ← Back to Humsafar
        </button>

        <div className="p-5 md:p-7">
          {/* header */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-rose-500/40">
                {initial}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-1">
                  Humsafar Matrimony Profile
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-1">
                  {profile.name || "Name not available"}
                </h1>
                <p className="text-xs text-slate-500 mb-2">
                  {profile.age && `${profile.age} yrs`}{" "}
                  {profile.gender && <>• {profile.gender} </>}{" "}
                  {profile.height && <>• {profile.height}</>}
                </p>

                {/* tags */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {profileNo && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Profile No: {profileNo}
                    </span>
                  )}
                  {profile.groupProfileNo && (
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Group: {profile.groupProfileNo}
                    </span>
                  )}
                  {profile.groupName && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                      {profile.groupName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* small badge on right (desktop) */}
            <div className="hidden md:flex flex-col items-end gap-1 text-[11px] text-slate-500">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
                <Heart size={12} className="text-rose-500" />
                <span>Rishtey wahi, jo dil se judey.</span>
              </div>
              {profile.city && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700">
                  <MapPin size={12} />
                  <span>{profile.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* main content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 mb-4">
            {/* left column */}
            <div className="space-y-2">
              <Field icon={<Briefcase size={14} />} label="Education" value={profile.education} />
              <Field icon={<Briefcase size={14} />} label="Profession" value={profile.profession} />
              <Field label="Company" value={profile.company} />
              <Field label="Income" value={profile.income} />
              <Field
                icon={<MapPin size={14} />}
                label="City / Location"
                value={profile.city || profile.pob}
              />
              <Field label="Address" value={profile.address} />
            </div>

            {/* right column */}
            <div className="space-y-2">
              <Field icon={<Calendar size={14} />} label="Date of Birth" value={profile.dob} />
              <Field label="Birth Time" value={profile.tob} />
              <Field label="Birth Place" value={profile.pob} />
              <Field label="Height" value={profile.height} />
              <Field label="Complexion" value={profile.complexion} />
              <Field label="Diet" value={profile.diet} />
              <Field label="Manglik" value={profile.manglik} />
            </div>
          </div>

          {/* family & contact */}
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                icon={<Users size={14} />}
                label="Father"
                value={
                  profile.fatherOcc
                    ? `${profile.father || ""} (${profile.fatherOcc})`
                    : profile.father
                }
              />
              <Field
                icon={<Users size={14} />}
                label="Mother"
                value={
                  profile.motherOcc
                    ? `${profile.mother || ""} (${profile.motherOcc})`
                    : profile.mother
                }
              />
              <Field label="Siblings" value={profile.siblings} />
            </div>

            <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <Phone size={14} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    Contact details are protected
                  </p>
                  <p className="text-xs text-slate-500">
                    For privacy, mobile numbers are shared only with authorised
                    Humsafar partners / group admins. Please connect with your
                    WhatsApp group admin to proceed with this profile.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* footer note */}
          <p className="mt-5 text-[11px] text-slate-400 text-center">
            This is a standardised biodata view generated from WhatsApp profile
            information. Please verify all details directly with the family.
          </p>
        </div>
      </div>
    </div>
  );
}

const Field = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <p className="flex items-start gap-2 text-sm">
      {icon && <span className="mt-[2px] text-slate-400">{icon}</span>}
      <span>
        <span className="font-semibold text-slate-700 mr-1">{label}:</span>
        <span className="text-slate-700">{value}</span>
      </span>
    </p>
  );
};
