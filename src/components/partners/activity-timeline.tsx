import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui";

interface ActivityItem {
  id: string;
  date: string;
  title: string;
  details: string;
  badgeTone: string;
  qrToken?: string;
  batchCode?: string;
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Verified Contribution Timeline</h3>
        <p className="mt-4 text-sm text-slate-500">
          No verified activity recorded yet. Events appear automatically as waste batches undergo operator inspection.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Verified Contribution Timeline</h3>
          <p className="text-xs text-slate-500">
            Public-safe event stream. Internal operator logistics, exact routes, and personal details are redacted.
          </p>
        </div>
        <Badge tone="slate">Recent 10 Inspections</Badge>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5">
                  {item.badgeTone === "green" ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : item.badgeTone === "amber" ? (
                    <AlertTriangle size={18} className="text-amber-600" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-500">{formattedDate}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.details}</p>
                </div>
              </div>

              {item.qrToken && (
                <Link
                  href={`/trace/${item.qrToken}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--orbit-primary)] hover:bg-[var(--orbit-primary)]/10"
                >
                  <span>Trace</span>
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
