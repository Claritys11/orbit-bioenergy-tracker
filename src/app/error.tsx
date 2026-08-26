"use client";

import { Card, Button } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-md text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">The error has been contained. No stack traces or secrets are exposed to users.</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </Card>
    </main>
  );
}
