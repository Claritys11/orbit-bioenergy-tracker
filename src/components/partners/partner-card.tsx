import Link from "next/link";
import { ArrowRight, Flame, ShieldCheck, Zap } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { PartnerSummary } from "@/lib/domain/partner-recognition";

export function PartnerCard({ partner }: { partner: PartnerSummary }) {
  const m = partner.metrics;
  const hasContributions = m.totalBatches > 0 && m.acceptedMassKg > 0;

  return (
    <Card className="group flex flex-col justify-between transition-all hover:border-[var(--orbit-primary)] hover:shadow-md">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Badge tone={partner.type === "SCHOOL" ? "green" : partner.type === "OPERATOR" ? "blue" : "purple"}>
            {partner.statusLabel}
          </Badge>
          {partner.isFounding && <Badge tone="amber">Pioneer Pilot</Badge>}
        </div>

        <h3 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-[var(--orbit-primary)]">
          <Link href={`/partners/${partner.slug}`} className="focus:outline-none">
            {partner.name}
          </Link>
        </h3>
        <p className="text-xs text-slate-500">{partner.city} · Partner since {new Date(partner.joinedAt).getFullYear()}</p>

        {hasContributions ? (
          <div className="mt-4 space-y-2">
            {/* Streak & Acceptance highlight */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {m.streak.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-bold text-amber-800 border border-amber-200">
                  <Flame size={12} className="text-amber-600" />
                  {m.streak.currentStreak} wk streak
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 border border-emerald-200">
                <ShieldCheck size={12} className="text-emerald-600" />
                {m.acceptanceRate}% quality
              </span>
              {m.traceableGasM3 > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-800 border border-blue-200">
                  <Zap size={12} className="text-blue-600" />
                  {m.traceableGasM3} m³ gas
                </span>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
              <div>
                <p className="text-slate-500">Accepted Feedstock</p>
                <p className="font-extrabold text-slate-900">{m.acceptedMassKg.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-slate-500">Verified Batches</p>
                <p className="font-extrabold text-slate-900">{m.verifiedBatches}</p>
              </div>
            </div>

            {/* Achievements Snippet */}
            {partner.topAchievements.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Badges:</span>
                {partner.topAchievements.map((badge) => (
                  <span
                    key={badge.key}
                    title={badge.title}
                    className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700"
                  >
                    {badge.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
            {partner.type === "COMMUNITY_PARTNER"
              ? "Community monitoring & advocacy partner. Physical feedstock contributions not required."
              : "Registered in ORBIT. Verified contribution data will appear after the first inspected load."}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">
          {hasContributions ? `${m.orbitRecognitionScore} Recognition Score` : "New Partner"}
        </span>
        <Link
          href={`/partners/${partner.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--orbit-primary)] group-hover:translate-x-0.5 transition-transform"
        >
          <span>View Profile</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
}
