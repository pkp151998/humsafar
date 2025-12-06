// src/components/MemberDashboard.jsx
import React, { useState } from "react";
import { LogOut, User, Shield, HeartHandshake } from "lucide-react";

export default function MemberDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview"); // "overview" | "profile" | "account";

  const tag =
    user.managedBy === "family" ? "FAMILY-MANAGED" : "SELF-MANAGED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40">
              <HeartHandshake size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Humsafar Member
              </p>
              <h1 className="text-sm md:text-base font-semibold text-slate-100">
                Welcome, {user.displayName || user.email}
              </h1>
              <p className="text-[11px] text-slate-400">
                Profile type: <span className="font-semibold">{tag}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          {/* TABS */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setTab("overview")}
                className={
                  "px-3 py-1.5 rounded-full border " +
                  (tab === "overview"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800")
                }
              >
                Overview
              </button>
              <button
                onClick={() => setTab("profile")}
                className={
                  "px-3 py-1.5 rounded-full border " +
                  (tab === "profile"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800")
                }
              >
                My Profile
              </button>
              <button
                onClick={() => setTab("account")}
                className={
                  "px-3 py-1.5 rounded-full border " +
                  (tab === "account"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800")
                }
              >
                Account & Security
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          {tab === "overview" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-50 mb-1">
                Your Matrimony Space
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                You&apos;re logged in as a Humsafar member. Soon you&apos;ll be able
                to manage your complete biodata, photos, and visibility
                preferences from here.
              </p>

              <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-300">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Account Email
                  </p>
                  <p className="font-mono text-slate-100">{user.email}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Managed By
                  </p>
                  <p className="font-semibold">
                    {user.managedBy === "family"
                      ? "Family / Parents"
                      : "Self"}
                  </p>
                </div>
              </div>

              <div className="mt-5 text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                Coming soon:
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Create your own biodata directly from WhatsApp text</li>
                  <li>Edit and update your details anytime</li>
                  <li>Control what is visible to public and to admins</li>
                </ul>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-50 mb-1">
                My Biodata
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                In the next phase, this section will show your live biodata as
                seen by admins and potential matches.
              </p>

              <div className="bg-slate-950/60 border border-dashed border-slate-700 rounded-xl p-4 text-xs text-slate-400">
                <p className="mb-2">
                  ✅ Your member account is active. Your detailed marriage
                  profile will either be:
                </p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>
                    Created by you (self-managed), or
                  </li>
                  <li>
                    Added by your family / group admin (family-managed).
                  </li>
                </ul>

                <p className="mt-3">
                  Once this feature is enabled, you&apos;ll be able to:
                </p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Paste your WhatsApp biodata and auto-fill details</li>
                  <li>Review and edit all important fields</li>
                  <li>Download / share a clean biodata copy</li>
                </ul>
              </div>
            </div>
          )}

          {tab === "account" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-50 mb-1">
                Account & Security
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Basic account details. For password reset, please use the
                &quot;Forgot password&quot; option on the login screen.
              </p>

              <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-300">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2">
                  <User size={14} className="mt-[2px] text-slate-400" />
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">
                      Display Name
                    </p>
                    <p className="font-semibold text-slate-100">
                      {user.displayName || "Not set"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      This is the name we show on your member dashboard.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2">
                  <Shield size={14} className="mt-[2px] text-slate-400" />
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">
                      Login & Security
                    </p>
                    <p className="text-[11px] text-slate-300">
                      For now, you can reset your password via the email-based
                      &quot;Forgot password&quot; flow on the login screen.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Later we can add in-dashboard options for password change
                      and 2-step verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
