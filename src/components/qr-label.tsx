"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui";

export function QrLabel({ value, batchCode }: { value: string; batchCode: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 220 }).then(setSrc);
  }, [value]);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">ORBIT Trace Label</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{batchCode}</h2>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`QR label for ${batchCode}`} className="mx-auto mt-4 h-56 w-56" />
      ) : (
        <div className="mt-4 h-56 animate-pulse rounded bg-slate-100" />
      )}
      <p className="mt-3 break-all text-xs text-slate-500">{value}</p>
      <Button className="no-print mt-4" variant="secondary" onClick={() => window.print()}>
        Print label
      </Button>
    </div>
  );
}
