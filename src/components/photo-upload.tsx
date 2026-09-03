"use client";

import { useState } from "react";
import { Camera, Upload, X } from "lucide-react";

export function PhotoUpload({ name = "photoUrl" }: { name?: string }) {
  const [preview, setPreview] = useState<string>("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPreview("");
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={preview} />

      {preview ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Batch verification photo" className="h-44 w-full object-cover" />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-red-600 transition"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:bg-slate-100 transition">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--orbit-primary)]">
            <Camera className="h-4 w-4" />
            <Upload className="h-4 w-4" />
            Take Photo or Select File
          </div>
          <p className="mt-1 text-xs text-slate-500">Optional audit image for waste verification</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
}
