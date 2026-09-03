"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui";

export function ContainerQrTag({
  containerCode,
  qrToken,
  orgName,
  sourceName,
  categoryName,
  capacityKg,
}: {
  containerCode: string;
  qrToken: string;
  orgName: string;
  sourceName: string;
  categoryName: string;
  capacityKg?: number | null;
}) {
  const [dataUrl, setDataUrl] = useState("");
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/c/${qrToken}`
    : `https://orbit.test/c/${qrToken}`;

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      margin: 2,
      width: 280,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    }).then(setDataUrl);
  }, [publicUrl]);

  return (
    <div className="mx-auto max-w-sm rounded-xl border-2 border-slate-900 bg-white p-6 shadow-md print:border-slate-900 print:shadow-none">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--orbit-primary)]">
            ORBIT PERSISTENT DIGITAL TAG
          </span>
          <h3 className="text-xl font-black text-slate-900">{containerCode}</h3>
        </div>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
          REUSABLE
        </span>
      </div>

      <div className="my-4 text-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR Tag for ${containerCode}`}
            className="mx-auto h-52 w-52 rounded border border-slate-100 p-1"
          />
        ) : (
          <div className="mx-auto h-52 w-52 animate-pulse rounded bg-slate-100" />
        )}
        <p className="mt-2 font-mono text-xs font-semibold text-slate-600">{publicUrl}</p>
      </div>

      <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Origin Org:</span>
          <span className="font-bold text-slate-900">{orgName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Waste Source:</span>
          <span className="font-bold text-slate-900">{sourceName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Feedstock Type:</span>
          <span className="font-bold text-slate-900">{categoryName}</span>
        </div>
        {capacityKg ? (
          <div className="flex justify-between">
            <span className="text-slate-500">Max Capacity:</span>
            <span className="font-bold text-slate-900">{capacityKg} kg</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-center text-[11px] font-semibold leading-tight text-amber-900">
        🛡️ No QR = No Traceable Credit
        <p className="mt-0.5 font-normal text-amber-800">
          Scan to connect physical waste with ORBIT verified energy allocation.
        </p>
      </div>

      <div className="no-print mt-5 text-center">
        <Button variant="secondary" className="w-full" onClick={() => window.print()}>
          🖨️ Print Container Tag
        </Button>
      </div>
    </div>
  );
}
