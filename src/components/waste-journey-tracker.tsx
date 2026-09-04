import {
  CheckCircle2,
  Factory,
  Flame,
  Gauge,
  Layers,
  Recycle,
  Scale,
  Truck,
  Zap,
} from "lucide-react";
import { cn, formatGas, formatKg } from "@/lib/utils";
import { DataConfidenceBadge, type ConfidenceLevel } from "./ui";

export type JourneyStage =
  | "WASTE"
  | "COLLECTION"
  | "VERIFICATION"
  | "FEEDSTOCK"
  | "CONVERSION"
  | "BIOGAS"
  | "ALLOCATION"
  | "FULFILMENT";

export interface JourneyStageData {
  stage: JourneyStage;
  label: string;
  sublabel: string;
  icon: typeof Recycle;
  confidence: ConfidenceLevel;
  value?: string;
  timestamp?: string;
}

const STAGES: Array<{
  stage: JourneyStage;
  label: string;
  sublabel: string;
  icon: typeof Recycle;
  confidence: ConfidenceLevel;
}> = [
  {
    stage: "WASTE",
    label: "Waste Registered",
    sublabel: "Source declaration in reusable container",
    icon: Recycle,
    confidence: "UNVERIFIED",
  },
  {
    stage: "COLLECTION",
    label: "Collection & Transport",
    sublabel: "Logistics operator custody",
    icon: Truck,
    confidence: "UNVERIFIED",
  },
  {
    stage: "VERIFICATION",
    label: "Facility Verification",
    sublabel: "Calibrated gross weighing & contamination inspection",
    icon: Scale,
    confidence: "MEASURED",
  },
  {
    stage: "FEEDSTOCK",
    label: "Accepted Feedstock",
    sublabel: "Net organic feedstock prepared for digester",
    icon: Layers,
    confidence: "VERIFIED_FEEDSTOCK",
  },
  {
    stage: "CONVERSION",
    label: "Anaerobic Digestion",
    sublabel: "Biodigester microbial conversion cycle",
    icon: Factory,
    confidence: "ESTIMATED",
  },
  {
    stage: "BIOGAS",
    label: "Verified Biogas",
    sublabel: "Physical flow meter reading",
    icon: Flame,
    confidence: "VERIFIED_BIOGAS",
  },
  {
    stage: "ALLOCATION",
    label: "Energy Allocation",
    sublabel: "Automated 50/30/20 credit distribution",
    icon: Zap,
    confidence: "ESTIMATED",
  },
  {
    stage: "FULFILMENT",
    label: "Clean Fuel Return",
    sublabel: "Delivered energy benefit",
    icon: Gauge,
    confidence: "VERIFIED",
  },
];

const STAGE_ORDER: Record<JourneyStage, number> = {
  WASTE: 0,
  COLLECTION: 1,
  VERIFICATION: 2,
  FEEDSTOCK: 3,
  CONVERSION: 4,
  BIOGAS: 5,
  ALLOCATION: 6,
  FULFILMENT: 7,
};

export function resolveStageFromStatus(status: string): JourneyStage {
  const norm = status.toUpperCase().replace(/\s+/g, "_");
  if (norm === "READY_FOR_PICKUP") return "WASTE";
  if (["REQUESTED", "ACCEPTED", "SCHEDULED", "IN_TRANSIT"].includes(norm)) return "COLLECTION";
  if (norm === "AT_FACILITY" || norm === "DELIVERED") return "VERIFICATION";
  if (norm === "ACCEPTED" || norm === "CONDITIONAL") return "FEEDSTOCK";
  if (norm === "CONVERTING") return "CONVERSION";
  if (norm === "CONVERTED") return "BIOGAS";
  if (norm === "ALLOCATED") return "ALLOCATION";
  if (norm === "FULFILLED") return "FULFILMENT";
  return "WASTE";
}

export function WasteJourneyTracker({
  currentStage,
  batchCode,
  compact = false,
  metrics,
  className,
}: {
  currentStage: JourneyStage | string;
  batchCode?: string;
  compact?: boolean;
  metrics?: {
    declaredKg?: number | null;
    verifiedGrossKg?: number | null;
    acceptedMassKg?: number | null;
    estimatedGasM3?: number | null;
    verifiedGasM3?: number | null;
    allocatedGasM3?: number | null;
    fulfilledGasM3?: number | null;
  };
  className?: string;
}) {
  const activeStageKey =
    typeof currentStage === "string" && !(currentStage in STAGE_ORDER)
      ? resolveStageFromStatus(currentStage)
      : (currentStage as JourneyStage);

  const currentIndex = STAGE_ORDER[activeStageKey] ?? 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-xs",
        compact ? "p-3.5 sm:p-4" : "p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--orbit-primary)]">
              ORBIT SIGNATURE TRACEABILITY
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
              Chain of Custody
            </span>
          </div>
          <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-950">
            Organic Waste → Clean Bioenergy Journey
            {batchCode ? <span className="ml-2 font-mono text-xs text-slate-500 font-normal">({batchCode})</span> : null}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Current Phase:</span>
          <span className="font-bold text-[var(--orbit-primary)]">{STAGES[currentIndex].label}</span>
        </div>
      </div>

      {/* Desktop Horizontal Stepper */}
      <div className="mt-6 hidden lg:block overflow-x-auto pb-2">
        <div className="grid grid-cols-8 gap-2 relative">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;
            const Icon = s.icon;

            return (
              <div key={s.stage} className="flex flex-col items-center text-center relative group">
                {/* Connector Line */}
                {idx < STAGES.length - 1 ? (
                  <div
                    className={cn(
                      "absolute top-4 left-1/2 w-full h-0.5 z-0 transition-colors",
                      idx < currentIndex ? "bg-emerald-500" : "bg-slate-200",
                    )}
                    aria-hidden="true"
                  />
                ) : null}

                {/* Node Circle */}
                <div
                  className={cn(
                    "relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all shadow-2xs",
                    isCompleted && "bg-emerald-600 text-white",
                    isCurrent && "bg-[var(--orbit-primary)] text-white ring-4 ring-[var(--orbit-primary)]/20 scale-110",
                    isUpcoming && "border border-slate-300 bg-white text-slate-400",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} aria-hidden="true" />
                  ) : (
                    <Icon size={14} aria-hidden="true" />
                  )}
                </div>

                {/* Step Content */}
                <p
                  className={cn(
                    "mt-2.5 text-xs font-bold leading-tight transition-colors",
                    isCurrent ? "text-slate-950" : isCompleted ? "text-slate-800" : "text-slate-400",
                  )}
                >
                  {s.label}
                </p>

                <div className="mt-1">
                  <DataConfidenceBadge level={s.confidence} className="scale-90 origin-top text-[10px]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="mt-5 space-y-3 lg:hidden">
        {STAGES.map((s, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;
          const Icon = s.icon;

          return (
            <div
              key={s.stage}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3 transition-all",
                isCurrent && "border border-[var(--orbit-primary)]/40 bg-[var(--orbit-primary)]/5 shadow-2xs",
                isCompleted && "bg-emerald-50/40 border border-emerald-100",
                isUpcoming && "opacity-60 bg-slate-50 border border-slate-100",
              )}
            >
              <div
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold mt-0.5",
                  isCompleted && "bg-emerald-600 text-white",
                  isCurrent && "bg-[var(--orbit-primary)] text-white ring-2 ring-[var(--orbit-primary)]/30",
                  isUpcoming && "border border-slate-300 bg-white text-slate-400",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 size={14} aria-hidden="true" />
                ) : (
                  <Icon size={13} aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs font-bold text-slate-900">{s.label}</p>
                  <DataConfidenceBadge level={s.confidence} className="text-[9px] py-0 px-1.5" />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 leading-snug">{s.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Measurement Summary Bar */}
      {metrics ? (
        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">
            Supply Chain Yield Data
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 text-[11px]">Declared Gross:</span>
              <p className="font-bold text-slate-900">{formatKg(metrics.declaredKg)}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Facility Accepted:</span>
              <p className="font-bold text-emerald-800">{formatKg(metrics.acceptedMassKg)}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Model Estimated Gas:</span>
              <p className="font-bold text-[var(--orbit-primary)]">{formatGas(metrics.estimatedGasM3)}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Verified Biogas:</span>
              <p className="font-bold text-emerald-700">
                {metrics.verifiedGasM3 ? formatGas(metrics.verifiedGasM3) : "Pending conversion"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
