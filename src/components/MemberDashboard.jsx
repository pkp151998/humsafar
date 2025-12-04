// src/components/MemberDashboard.jsx
import React from "react";

export default function MemberDashboard({ user, onLogout }) {
  const tag =
    user.managedBy === "family" ? "FAMILY-MANAGED" : "SELF-MANAGED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
              Humsafar Member
            </p>
            <h1 className="text-sm md:text-base font-semibold text-slate-100">
              Welcome, {user.displayName || user.email}
            </h1>
            <p className="text-[11px] text-slate-400">
              Profile type: <span className="font-semibold">{tag}</span>
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-slate-50 mb-1">
            Your Matrimony Profile
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            This is a basic member dashboard placeholder. Next, we’ll let you
            create, edit, and manage your own biodata here.
          </p>

          <div className="text-xs text-slate-300 space-y-1">
            <p>
              • Logged in as:{" "}
              <span className="font-mono text-slate-100">
                {user.email}
              </span>
            </p>
            <p>• Role: <span className="font-semibold">Member</span></p>
            <p>
              • Managed by:{" "}
              <span className="font-semibold">
                {user.managedBy === "family" ? "Family / Parents" : "Self"}
              </span>
            </p>
          </div>

          <div className="mt-5 text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            Coming soon:
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>Create your profile from WhatsApp biodata</li>
              <li>Edit and update your details anytime</li>
              <li>Control what is visible to public and to admins</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
