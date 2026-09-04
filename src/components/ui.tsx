import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--orbit-primary)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[var(--orbit-primary)] text-white hover:bg-[var(--orbit-primary-dark)]",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-[var(--orbit-primary)]/8",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--orbit-primary)]",
        variant === "primary" && "bg-[var(--orbit-primary)] text-white hover:bg-[var(--orbit-primary-dark)]",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-[var(--orbit-primary)]/8",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    green: "bg-[#00C972]/20 text-black ring-[#00C972]/50 font-bold",
    amber: "bg-[#7209B7]/15 text-[#7209B7] ring-[#7209B7]/30 font-semibold",
    red: "bg-black/10 text-black ring-black/30 font-semibold",
    blue: "bg-[#000FC4]/10 text-[#000FC4] ring-[#000FC4]/30 font-semibold",
    purple: "bg-[#7209B7]/15 text-[#7209B7] ring-[#7209B7]/30 font-semibold",
    slate: "bg-slate-100 text-black ring-slate-300 font-medium",
  };
  return (
    <span className={cn("inline-flex rounded px-2 py-1 text-xs ring-1", tones[tone])}>
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  step,
  min,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  step?: string;
  min?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={step}
        min={min}
        placeholder={placeholder}
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      {label}
      <select
        name={name}
        required={required}
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      {label}
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        rows={4}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
      />
    </label>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">ORBIT</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </Card>
  );
}
