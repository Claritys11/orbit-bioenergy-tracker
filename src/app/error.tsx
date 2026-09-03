"use client";

import { useEffect } from "react";
import { Card, Button, LinkButton } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to client console for easier debugging
    console.error("[ORBIT Unhandled Error]:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4 bg-slate-50">
      <Card className="max-w-md p-8 text-center shadow-md">
        <span className="text-4xl">⚠️</span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          An error occurred while loading this page.
        </p>

        {error?.digest ? (
          <p className="mt-2 rounded bg-slate-100 p-2 font-mono text-xs text-slate-500">
            Error Digest: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <LinkButton href="/" variant="secondary">
            Return Home
          </LinkButton>
        </div>
      </Card>
    </main>
  );
}
