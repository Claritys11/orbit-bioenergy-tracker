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

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  FlaskConical,
  HelpCircle,
  Scale,
  Sparkles,
} from "lucide-react";

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-600/30 font-semibold",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-600/30 font-semibold",
    amber: "bg-amber-50 text-amber-900 ring-amber-500/30 font-semibold",
    warning: "bg-amber-50 text-amber-900 ring-amber-500/30 font-semibold",
    red: "bg-red-50 text-red-800 ring-red-600/30 font-semibold",
    danger: "bg-red-50 text-red-800 ring-red-600/30 font-semibold",
    blue: "bg-sky-50 text-sky-800 ring-sky-600/30 font-semibold",
    info: "bg-sky-50 text-sky-800 ring-sky-600/30 font-semibold",
    purple: "bg-indigo-50 text-indigo-800 ring-indigo-600/30 font-semibold",
    slate: "bg-slate-100 text-slate-800 ring-slate-300/80 font-medium",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ring-1 ring-inset",
        tones[tone] ?? tones.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}

export type ConfidenceLevel =
  | "UNVERIFIED"
  | "MEASURED"
  | "VERIFIED_FEEDSTOCK"
  | "ESTIMATED"
  | "VERIFIED_BIOGAS"
  | "VERIFIED"
  | "Measured"
  | "Estimated"
  | "Simulated Demo"
  | "Pilot Assumption"
  | "Pending Field Validation";

export function DataConfidenceBadge({
  level,
  detail,
  className,
}: {
  level: ConfidenceLevel;
  detail?: string;
  className?: string;
}) {
  let label = "UNVERIFIED";
  let tone: "slate" | "green" | "amber" | "blue" | "purple" = "slate";
  let Icon = Clock;
  let explanation = "Source declaration; facility scale weighing pending.";

  switch (level) {
    case "UNVERIFIED":
    case "Pending Field Validation":
      label = "UNVERIFIED";
      tone = "slate";
      Icon = Clock;
      explanation = "Source-side declaration; calibrated facility scale measurement pending.";
      break;
    case "MEASURED":
    case "Measured":
      label = "MEASURED";
      tone = "green";
      Icon = Scale;
      explanation = "Calibrated physical scale reading verified at facility receiving.";
      break;
    case "VERIFIED_FEEDSTOCK":
      label = "ACCEPTED FEEDSTOCK";
      tone = "green";
      Icon = CheckCircle2;
      explanation = "Quality verified net organic feedstock after sorting and contamination removal.";
      break;
    case "ESTIMATED":
    case "Estimated":
      label = "ESTIMATED";
      tone = "blue";
      Icon = Cpu;
      explanation = "Algorithm model estimate projected from feedstock yield factors.";
      break;
    case "VERIFIED_BIOGAS":
    case "VERIFIED":
      label = "VERIFIED BIOGAS";
      tone = "green";
      Icon = CheckCircle2;
      explanation = "Physical gas output verified from facility flow meter.";
      break;
    case "Simulated Demo":
      label = "SIMULATED DEMO";
      tone = "amber";
      Icon = FlaskConical;
      explanation = "Demonstration data for training and simulation purposes.";
      break;
    case "Pilot Assumption":
      label = "PILOT ASSUMPTION";
      tone = "purple";
      Icon = Sparkles;
      explanation = "Pilot benchmark figure based on standardized laboratory yields.";
      break;
  }

  return (
    <span
      title={detail ?? explanation}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight shadow-2xs",
        tone === "green" && "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/30",
        tone === "amber" && "bg-amber-50 text-amber-900 ring-1 ring-amber-500/30",
        tone === "blue" && "bg-sky-50 text-sky-800 ring-1 ring-sky-500/30",
        tone === "purple" && "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500/30",
        tone === "slate" && "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
        className,
      )}
    >
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const norm = status.toUpperCase().replace(/\s+/g, "_");
  let tone: "green" | "amber" | "red" | "blue" | "slate" = "slate";
  let Icon = HelpCircle;

  if (["ACCEPTED", "DELIVERED", "VERIFIED", "COMPLETED", "ACTIVE"].includes(norm)) {
    tone = "green";
    Icon = CheckCircle2;
  } else if (["CONDITIONAL", "SCHEDULED", "IN_TRANSIT", "PENDING_OPERATOR_RESPONSE", "PENDING"].includes(norm)) {
    tone = "amber";
    Icon = Clock;
  } else if (["REJECTED", "CANCELLED", "FAILED"].includes(norm)) {
    tone = "red";
    Icon = AlertCircle;
  } else if (["READY_FOR_PICKUP", "AT_FACILITY"].includes(norm)) {
    tone = "blue";
    Icon = Scale;
  }

  return (
    <Badge tone={tone} className="gap-1.5 font-bold uppercase tracking-wider text-[10px]">
      <Icon size={11} aria-hidden="true" />
      <span>{status.replace(/_/g, " ")}</span>
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center",
        className,
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-xs text-slate-400">
        <Clock size={22} aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-5 text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  value,
  onChange,
  step,
  min,
  placeholder,
  disabled,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  step?: string;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-900">
      <span className="flex items-center justify-between">
        <span>{label} {required ? <span className="text-red-500">*</span> : null}</span>
        {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-950 shadow-2xs transition focus:border-[var(--orbit-primary)] focus:ring-2 focus:ring-[var(--orbit-primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-900">
      <span className="flex items-center justify-between">
        <span>{label} {required ? <span className="text-red-500">*</span> : null}</span>
        {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
      </span>
      <select
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-950 shadow-2xs transition focus:border-[var(--orbit-primary)] focus:ring-2 focus:ring-[var(--orbit-primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
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
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-900">
      <span className="flex items-center justify-between">
        <span>{label} {required ? <span className="text-red-500">*</span> : null}</span>
        {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
      </span>
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-950 shadow-2xs transition focus:border-[var(--orbit-primary)] focus:ring-2 focus:ring-[var(--orbit-primary)]/20"
      />
    </label>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: {
  title: string;
  description: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumbs" className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {idx > 0 ? <ChevronRight size={12} className="text-slate-400" /> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[var(--orbit-primary)] hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-700">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">
            ORBIT OPERATIONAL WORKSPACE
          </p>
        )}
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  confidence,
}: {
  label: string;
  value: string;
  hint?: string;
  confidence?: ConfidenceLevel;
}) {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          {confidence ? <DataConfidenceBadge level={confidence} /> : null}
        </div>
        <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
      </div>
      {hint ? <p className="mt-2 text-xs leading-normal text-slate-500 border-t border-slate-100 pt-2">{hint}</p> : null}
    </Card>
  );
}
