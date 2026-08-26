import { Card } from "@/components/ui";
import { ConfidenceBadge } from "./confidence";
import type { Confidence } from "@/lib/public-data";

export function PublicMetric({
  label,
  value,
  unit,
  confidence,
  period,
  updated,
}: {
  label: string;
  value: string;
  unit: string;
  confidence: Confidence;
  period: string;
  updated: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <ConfidenceBadge value={confidence} />
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="text-sm text-slate-500">{unit}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{period}. Updated {new Date(updated).toLocaleDateString("en-US")}.</p>
    </Card>
  );
}
