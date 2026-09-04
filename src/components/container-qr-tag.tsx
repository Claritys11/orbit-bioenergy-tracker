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
    : `https://jawe.clarityz.my.id/c/${qrToken}`;

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: 320,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).then(setDataUrl);
  }, [publicUrl]);

  return (
    <div className="orbit-print-tag mx-auto max-w-sm rounded-xl border-2 border-slate-950 bg-white p-6 shadow-md print:border-2 print:border-black print:p-6 print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-950 pb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 print:text-black">
            ORBIT PERSISTENT DIGITAL TAG
          </span>
          <h3 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">
            {containerCode}
          </h3>
        </div>
        <span className="rounded border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[11px] font-black tracking-wider text-emerald-800 print:border-black print:bg-transparent print:text-black">
          REUSABLE
        </span>
      </div>

      {/* QR Code and Tag Caption */}
      <div className="my-5 text-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR Tag for ${containerCode}`}
            className="mx-auto h-52 w-52 rounded border border-slate-200 p-1 print:border-0 print:p-0"
          />
        ) : (
          <div className="mx-auto h-52 w-52 animate-pulse rounded bg-slate-100" />
        )}
        <p className="mt-3 text-xs font-bold text-slate-950">
          QR Tag for {containerCode}
        </p>
        <p className="mt-0.5 break-all font-mono text-[11px] font-semibold text-slate-700 print:text-black">
          {publicUrl}
        </p>
      </div>

      {/* Structured Tag Metadata */}
      <div className="space-y-2.5 border-t-2 border-slate-950 pt-4 text-xs">
        <div>
          <p className="font-semibold text-slate-500 print:text-slate-700">Origin Org:</p>
          <p className="font-bold text-slate-950">{orgName}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-500 print:text-slate-700">Waste Source:</p>
          <p className="font-bold text-slate-950">{sourceName}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-500 print:text-slate-700">Feedstock Type:</p>
          <p className="font-bold text-slate-950">{categoryName}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-500 print:text-slate-700">Max Capacity:</p>
          <p className="font-bold text-slate-950">{capacityKg ? `${capacityKg} kg` : "50 kg"}</p>
        </div>
      </div>

      {/* Print Trigger Button (Hidden in Print) */}
      <div className="no-print mt-6 text-center">
        <Button
          variant="secondary"
          className="w-full font-semibold"
          onClick={() => window.print()}
        >
          🖨️ Print Container Tag
        </Button>
      </div>
    </div>
  );
}
