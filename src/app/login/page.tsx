"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/actions";
import { Button, Card, Field } from "@/components/ui";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const [state, formAction, pending] = useActionState(loginAction, null);

  const [email, setEmail] = useState("community@orbit.test");
  const [password, setPassword] = useState("OrbitDemo2026!");

  return (
    <Card className="w-full max-w-md">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--orbit-primary)]">ORBIT</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">Secure login</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {callbackUrl ? (
          <span className="font-semibold text-emerald-700">
            🔄 Scanned container detected. Log in to return directly to container batch registration.
          </span>
        ) : (
          "Use a demo account from the README. Login errors are intentionally generic."
        )}
      </p>
      {state?.error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          {state.error}
        </div>
      ) : null}
      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button disabled={pending}>
          <LogIn size={16} aria-hidden />
          {pending ? "Checking credentials..." : "Log in"}
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold text-slate-500">Quick fill demo accounts:</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setEmail("canteen@orbit.test");
              setPassword("OrbitDemo2026!");
            }}
            className="rounded bg-teal-100 px-2 py-1 font-semibold text-teal-800 hover:bg-teal-200"
          >
            Canteen Staff
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("school@orbit.test");
              setPassword("OrbitDemo2026!");
            }}
            className="rounded bg-blue-100 px-2 py-1 font-semibold text-blue-800 hover:bg-blue-200"
          >
            School Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("operator@orbit.test");
              setPassword("OrbitDemo2026!");
            }}
            className="rounded bg-amber-100 px-2 py-1 font-semibold text-amber-800 hover:bg-amber-200"
          >
            Operator
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("community@orbit.test");
              setPassword("OrbitDemo2026!");
            }}
            className="rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-200"
          >
            Community Facility (TPS3R)
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("super@orbit.test");
              setPassword("OrbitDemo2026!");
            }}
            className="rounded bg-purple-100 px-2 py-1 font-semibold text-purple-800 hover:bg-purple-200"
          >
            Super Admin
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10">
      <Suspense fallback={<Card className="w-full max-w-md p-8 text-center text-sm">Loading login...</Card>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
