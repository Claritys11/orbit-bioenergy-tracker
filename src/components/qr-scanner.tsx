"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button, Card, Field } from "@/components/ui";

export function QrScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  async function start() {
    setError("");
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          setResult(decoded);
          scanner.stop().catch(() => undefined);
        },
        () => undefined,
      );
    } catch {
      setError("Camera scanning is unavailable. Use the manual trace URL field.");
    }
  }

  return (
    <Card>
      <div id="qr-reader" className="min-h-64 overflow-hidden rounded-md border border-slate-200" />
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      {result ? (
        <a href={result} className="mt-3 block break-all text-sm font-semibold text-[var(--orbit-primary)]">
          {result}
        </a>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={start}>Start camera scan</Button>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("manual");
            if (value) window.location.href = String(value);
          }}
        >
          <Field label="Manual trace URL" name="manual" />
          <Button className="self-end" variant="secondary">Open</Button>
        </form>
      </div>
    </Card>
  );
}
