"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui";

export function ShareProfileButton({ partnerName }: { partnerName: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${partnerName} — ORBIT Public Impact Profile`,
          text: `Explore ${partnerName}'s verified organic recycling contributions and bioenergy impact on ORBIT.`,
          url,
        });
        return;
      } catch {
        // Fallback to copy if user dismissed or unsupported
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-xs font-semibold"
    >
      {copied ? (
        <>
          <Check size={14} className="text-emerald-600" />
          <span>Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={14} />
          <span>Share Impact Profile</span>
        </>
      )}
    </Button>
  );
}
