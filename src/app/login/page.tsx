"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/actions";
import { Button, Card, Field } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f5] px-4 py-10">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">ORBIT</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Secure login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use a demo account from the README. Login errors are intentionally generic.
        </p>
        {state?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
            {state.error}
          </div>
        ) : null}
        <form action={formAction} className="mt-6 grid gap-4">
          <Field label="Email" name="email" type="email" required defaultValue="operator@orbit.test" />
          <Field label="Password" name="password" type="password" required defaultValue="OrbitDemo2026!" />
          <Button disabled={pending}>
            <LogIn size={16} aria-hidden />
            {pending ? "Checking credentials..." : "Log in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
