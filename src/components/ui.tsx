import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { SubmitButton } from "@/components/submit-button";

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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--orbit-primary)] disabled:cursor-not-allowed disabled:opacity-60",
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

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "purple" | "slate" | string;
  className?: string;
}) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-900 ring-emerald-600/30 font-bold",
    amber: "bg-amber-50 text-amber-900 ring-amber-600/30 font-bold",
    red: "bg-red-50 text-red-900 ring-red-600/30 font-bold",
    blue: "bg-blue-50 text-blue-900 ring-blue-600/30 font-bold",
    purple: "bg-purple-50 text-purple-900 ring-purple-600/30 font-bold",
    slate: "bg-slate-100 text-slate-900 ring-slate-300 font-semibold",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
        tones[tone] || tones.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase().replace(/\s+/g, "_");

  // Waste & Pickup status mappings
  switch (normalized) {
    case "READY_FOR_PICKUP":
      return <Badge tone="blue">● Ready for Pickup</Badge>;
    case "PICKUP_REQUESTED":
    case "PENDING_OPERATOR_RESPONSE":
    case "PENDING":
      return <Badge tone="amber">⏳ Awaiting Operator</Badge>;
    case "ACCEPTED":
      return <Badge tone="green">✓ Accepted</Badge>;
    case "SCHEDULED":
    case "PICKUP_SCHEDULED":
      return <Badge tone="blue">🗓️ Scheduled</Badge>;
    case "IN_TRANSIT":
      return <Badge tone="purple">🚚 In Transit</Badge>;
    case "DELIVERED":
    case "DELIVERED_PHYSICALLY":
    case "AT_FACILITY":
      return <Badge tone="green">📦 Delivered</Badge>;
    case "UNDER_INSPECTION":
    case "AWAITING_INSPECTION":
      return <Badge tone="amber">🔍 Under Inspection</Badge>;
    case "CONDITIONAL":
      return <Badge tone="amber">⚠️ Conditional</Badge>;
    case "REJECTED":
    case "CANCELLED":
    case "FAILED":
      return <Badge tone="red">✕ {normalized.replace("_", " ")}</Badge>;
    case "PROCESSED":
    case "CLOSED":
    case "CONSUMED_AT_HUB":
      return <Badge tone="slate">✓ Complete</Badge>;
    case "PARTIALLY_FULFILLED":
      return <Badge tone="amber">◐ Partially Fulfilled</Badge>;
    default:
      return <Badge tone="slate">{status.replace(/_/g, " ")}</Badge>;
  }
}

export function AlertBanner({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50/80 text-blue-950",
    success: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
    warning: "border-amber-200 bg-amber-50/80 text-amber-950",
    error: "border-red-200 bg-red-50/80 text-red-950",
  };
  const icon = {
    info: "ℹ️",
    success: "✓",
    warning: "⚠️",
    error: "🛑",
  };

  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-xs leading-relaxed shadow-xs", styles[tone], className)}>
      <span className="text-base select-none">{icon[tone]}</span>
      <div className="flex-1">
        {title ? <p className="font-bold mb-0.5 text-sm">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      {icon ? <div className="mb-3 text-slate-400">{icon}</div> : null}
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-normal text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function MobileCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 sm:p-5", className)}>
      {children}
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
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      {label}
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
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm disabled:opacity-50"
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
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      {label}
      <select
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm disabled:opacity-50"
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
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      {label}
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
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

export function Metric({
  label,
  value,
  hint,
  confidence,
}: {
  label: string;
  value: string | number;
  hint?: string;
  confidence?: "Verified" | "Measured" | "Calculated" | "Estimated" | "Simulated Demo";
}) {
  const isUnmeasured =
    value === "0 kg" ||
    value === 0 ||
    value === "0.0 kg" ||
    value === "0 m3" ||
    value === "0.00 m3" ||
    value === "0%" ||
    value === "0.0%";
  const shouldMask =
    isUnmeasured &&
    (hint?.toLowerCase().includes("unverified") ||
      hint?.toLowerCase().includes("not yet") ||
      hint?.toLowerCase().includes("pending") ||
      hint?.toLowerCase().includes("calibrated") ||
      hint?.toLowerCase().includes("measured at hub") ||
      hint?.toLowerCase().includes("scale"));
  const displayValue = shouldMask ? "Pending verification" : String(value);

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          {confidence ? (
            <Badge
              tone={
                confidence === "Verified" || confidence === "Measured"
                  ? "green"
                  : confidence === "Calculated"
                  ? "blue"
                  : "slate"
              }
              className="text-[10px] px-1.5 py-0"
            >
              {confidence}
            </Badge>
          ) : null}
        </div>
        <p className={cn("mt-2 text-2xl font-black tracking-tight", shouldMask ? "text-slate-400 text-lg font-bold" : "text-slate-950")}>
          {displayValue}
        </p>
      </div>
      {hint ? <p className="mt-2 text-xs leading-normal text-slate-500">{hint}</p> : null}
    </Card>
  );
}
