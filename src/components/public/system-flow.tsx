import { Factory, Flame, Layers, Recycle, Scale, Truck } from "lucide-react";
import { DataConfidenceBadge } from "../ui";

const nodes = [
  {
    icon: Recycle,
    label: "1. Waste Registration",
    note: "Canteen marks reusable container ready",
    confidence: "UNVERIFIED" as const,
  },
  {
    icon: Truck,
    label: "2. Logistics Collection",
    note: "Operator routes & safe custody transit",
    confidence: "UNVERIFIED" as const,
  },
  {
    icon: Scale,
    label: "3. Facility Verification",
    note: "Calibrated scales weigh & sort contaminants",
    confidence: "MEASURED" as const,
  },
  {
    icon: Layers,
    label: "4. Accepted Feedstock",
    note: "Net accepted organic mass confirmed",
    confidence: "VERIFIED_FEEDSTOCK" as const,
  },
  {
    icon: Factory,
    label: "5. Anaerobic Conversion",
    note: "Biodigester microbial digestion cycle",
    confidence: "ESTIMATED" as const,
  },
  {
    icon: Flame,
    label: "6. Verified Biogas",
    note: "Certified physical flow meter log",
    confidence: "VERIFIED_BIOGAS" as const,
  },
];

export function SystemFlow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => {
        const Icon = node.icon;
        return (
          <div
            key={node.label}
            className="reveal-on-scroll relative rounded-2xl border border-white/70 bg-white/90 p-5 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:shadow-md hover:border-[var(--orbit-primary)]/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--orbit-primary)]/10 text-[var(--orbit-primary)] font-bold">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <DataConfidenceBadge level={node.confidence} className="text-[10px]" />
              </div>
              <h3 className="mt-3.5 text-sm font-extrabold text-slate-950">{node.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{node.note}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
