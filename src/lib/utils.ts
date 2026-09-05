import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKg(value: number | null | undefined, fallback = "Pending verification") {
  if (value === null || value === undefined) return fallback;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} kg`;
}

export function formatGas(value: number | null | undefined, fallback = "Pending verification") {
  if (value === null || value === undefined) return fallback;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} m3`;
}

export function humanise(value: string | null | undefined, fallback = "Not requested") {
  if (!value) return fallback;
  const normalized = value.trim().toUpperCase();
  if (normalized === "PENDING_OPERATOR_RESPONSE") return "Awaiting Operator";
  if (normalized === "READY_FOR_PICKUP") return "Ready for Pickup";
  if (normalized === "UNDER_INSPECTION") return "Under Inspection";
  if (normalized === "PICKUP_REQUESTED") return "Pickup Requested";
  if (normalized === "PICKUP_SCHEDULED") return "Pickup Scheduled";
  if (normalized === "IN_TRANSIT") return "In Transit";
  if (normalized === "DELIVERED") return "Delivered to Hub";
  if (normalized === "AT_FACILITY") return "At Facility";
  if (normalized === "PARTIALLY_FULFILLED") return "Partially Fulfilled";
  if (normalized === "FINALISED") return "Finalised";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPoolName(pool: string | null | undefined, fallback = "Community Facility / O&M Pool (30%)") {
  if (!pool) return fallback;
  const p = pool.toLowerCase();
  if (p === "operator" || p === "facility" || p === "community" || p === "o&m") return "Community Facility / O&M Pool (30%)";
  if (p === "schools" || p === "school") return "School Energy Pool (50%)";
  if (p === "contributors" || p === "contributor") return "Supporting Contributor Pool (20%)";
  return humanise(pool);
}
