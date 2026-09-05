"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingLabel,
  pendingText,
  className,
  variant = "primary",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: ReactNode;
  pendingText?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  const activePendingLabel = pendingLabel ?? pendingText ?? "Processing...";

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--orbit-primary)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[var(--orbit-primary)] text-white hover:bg-[var(--orbit-primary-dark)]",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-[var(--orbit-primary)]/8",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        className,
      )}
      {...props}
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{activePendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
