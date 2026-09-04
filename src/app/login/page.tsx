"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogIn, Recycle } from "lucide-react";
import { loginAction } from "@/app/actions";
import { Button } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { role: "Canteen Team", email: "canteen@orbit.test", label: "Canteen Staff" },
  { role: "School Admin", email: "school.admin@orbit.test", label: "School Admin" },
  { role: "Logistics Operator", email: "operator@orbit.test", label: "Logistics Operator" },
  { role: "Community Facility", email: "community.facility@orbit.test", label: "Community Facility" },
  { role: "Student Observer", email: "student@orbit.test", label: "Student" },
  { role: "System Admin", email: "superadmin@orbit.test", label: "Super Admin" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("operator@orbit.test");
  const [password, setPassword] = useState("OrbitDemo2026!");

  function selectDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("OrbitDemo2026!");
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center px-4 py-12 relative overflow-hidden text-slate-100">
      {/* Subtle Background Ambience */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[var(--orbit-primary)]/15 via-emerald-500/5 to-transparent pointer-events-none blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={14} /> Back to public overview
          </Link>
        </div>

        {/* Brand Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#00C972] to-[#059669] text-black shadow-xs font-black">
              <Recycle size={24} aria-hidden="true" />
            </span>
            <div>
              <span className="block text-xl font-black tracking-wider text-white">ORBIT</span>
              <span className="block text-[11px] text-emerald-400 font-medium">
                Organic Recycling & Bioenergy Impact Tracker
              </span>
            </div>
          </div>

          <div className="mt-6 border-l-2 border-emerald-500 pl-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Operational Workspace
            </p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">
              Track waste. Verify impact. Return energy.
            </p>
          </div>

          {state?.error ? (
            <div className="mt-5 rounded-lg border border-red-500/30 bg-red-950/50 p-3 text-xs font-semibold text-red-300">
              {state.error}
            </div>
          ) : null}

          <form action={formAction} className="mt-6 grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <Button
              disabled={pending}
              className="mt-2 min-h-11 w-full text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-black shadow-xs"
            >
              <LogIn size={16} aria-hidden="true" />
              {pending ? "Signing in to workspace..." : "Sign In to Workspace"}
            </Button>
          </form>

          {/* Quick Demo Role Selectors */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Quick Switcher — Pilot Demo Roles
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-left">
              {DEMO_ACCOUNTS.map((acc) => {
                const isActive = email === acc.email;
                return (
                  <button
                    type="button"
                    key={acc.email}
                    onClick={() => selectDemoAccount(acc.email)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                      isActive
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="block truncate font-semibold">{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security / System Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Role-Based Access Control enforced. All mutations recorded in audit log.
        </p>
      </div>
    </main>
  );
}
