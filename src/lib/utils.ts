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
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
