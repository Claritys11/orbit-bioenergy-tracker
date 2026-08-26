import { ArrowRight, ClipboardCheck, Factory, QrCode, Recycle, Truck, Zap } from "lucide-react";

const nodes = [
  { icon: Recycle, label: "Waste Source", note: "school canteen or contributor" },
  { icon: QrCode, label: "QR Batch", note: "opaque public trace ID" },
  { icon: ClipboardCheck, label: "Quality Verification", note: "accepted mass, contamination" },
  { icon: Truck, label: "Scheduled Collection", note: "rule-based pickup" },
  { icon: Factory, label: "Partner Conversion", note: "validated adult operators" },
  { icon: Zap, label: "Verified Biogas", note: "measured separately" },
];

export function SystemFlow() {
  return (
    <div className="grid gap-3 md:grid-cols-6">
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <div key={node.label} className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Icon size={22} className="text-[var(--orbit-primary)]" aria-hidden />
            <p className="mt-3 font-bold text-slate-950">{node.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{node.note}</p>
            {index < nodes.length - 1 ? <ArrowRight className="absolute -right-5 top-1/2 hidden text-amber-500 md:block" size={20} aria-hidden /> : null}
          </div>
        );
      })}
    </div>
  );
}
