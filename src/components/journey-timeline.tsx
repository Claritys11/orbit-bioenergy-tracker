import { Badge } from "@/components/ui";
import { humanise } from "@/lib/utils";

export interface TimelineEntry {
  status: string;
  at: string;
  actor?: string;
  notes?: string;
}

export function JourneyTimeline({
  timeline,
  batchCode,
  currentStatus,
}: {
  timeline: TimelineEntry[];
  batchCode: string;
  currentStatus: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--orbit-primary)]">
            AUDITABLE SUPPLY CHAIN TIMELINE
          </span>
          <h3 className="text-base font-bold text-slate-900">Batch {batchCode} Provenance</h3>
        </div>
        <Badge tone={currentStatus === "REJECTED" ? "red" : "green"}>{humanise(currentStatus)}</Badge>
      </div>

      <div className="relative mt-6 space-y-6 pl-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-0.5 before:bg-slate-200">
        {timeline.map((entry, index) => {
          return (
            <div key={`${entry.status}-${index}`} className="relative flex items-start gap-4">
              <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--orbit-primary)] text-white text-[10px] font-bold shadow">
                ✓
              </div>
              <div className="flex-1 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{humanise(entry.status)}</span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(entry.at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {entry.actor ? (
                  <p className="mt-1 font-medium text-slate-600">Actor: {entry.actor}</p>
                ) : null}
                {entry.notes ? <p className="mt-1 italic text-slate-500">{entry.notes}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
