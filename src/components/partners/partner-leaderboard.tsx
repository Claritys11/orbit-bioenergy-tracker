"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Award, Flame, Info, Sparkles, Trophy, Zap, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import type {
  LeaderboardCategory,
  LeaderboardEntry,
} from "@/lib/domain/partner-recognition";

interface PartnerLeaderboardProps {
  initialLeaderboard: Record<LeaderboardCategory, LeaderboardEntry[]>;
}

const categoryConfig: Record<
  LeaderboardCategory,
  { label: string; icon: typeof Trophy; description: string; tooltip: string }
> = {
  overall: {
    label: "Overall Recognition",
    icon: Award,
    description: "Multi-dimensional recognition index rewarding sorting quality (35%), consistency (30%), biogas impact (25%), and longevity (10%).",
    tooltip: "Clearly distinguished from Purity-to-Power operational calculation: this is a motivational recognition index.",
  },
  diverted: {
    label: "Accepted Organics",
    icon: Sparkles,
    description: "Net verified organic mass accepted after contamination inspection at operator hub.",
    tooltip: "Gross waste is not counted. Only accepted mass with low contamination qualifies.",
  },
  quality: {
    label: "Feedstock Quality",
    icon: ShieldCheck,
    description: "Lowest contamination rate across a verified sample (minimum 15 kg inspected mass).",
    tooltip: "Rewards proper source separation. Requires minimum verified sample size to prevent gaming.",
  },
  consistency: {
    label: "Weekly Consistency",
    icon: Flame,
    description: "Longest consecutive weekly contribution streak without missing calendar weeks.",
    tooltip: "Calculated by ISO calendar weeks. Rejected batches do not extend streak.",
  },
  energy: {
    label: "Energy Contribution",
    icon: Zap,
    description: "Traceable biogas generated or returned through verified anaerobic conversion.",
    tooltip: "Traceable through conversion cycles and fulfilled energy allocations.",
  },
};

export function PartnerLeaderboard({ initialLeaderboard }: PartnerLeaderboardProps) {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>("overall");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const currentCategoryMeta = categoryConfig[activeCategory];

  const filteredEntries = useMemo(() => {
    const raw = initialLeaderboard[activeCategory] || [];
    if (typeFilter === "ALL") return raw;
    return raw.filter((entry) => entry.partner.type === typeFilter);
  }, [initialLeaderboard, activeCategory, typeFilter]);

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Partner Leaderboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            Recognizing sorting accuracy, consistency, and bioenergy contribution.
          </p>
        </div>

        {/* Filter by Partner Type */}
        <div className="flex items-center gap-2">
          <label htmlFor="partner-type-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Filter:
          </label>
          <select
            id="partner-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-[var(--orbit-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--orbit-primary)]"
          >
            <option value="ALL">All Partner Types</option>
            <option value="SCHOOL">Schools Only</option>
            <option value="OPERATOR">Community Operators</option>
            <option value="SUPPORTING_CONTRIBUTOR">Supporting Contributors</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="tablist">
        {(Object.keys(categoryConfig) as LeaderboardCategory[]).map((cat) => {
          const cfg = categoryConfig[cat];
          const Icon = cfg.icon;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-[var(--orbit-primary)] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Icon size={14} aria-hidden />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Explainer Banner */}
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
        <Info size={16} className="mt-0.5 shrink-0 text-[var(--orbit-primary)]" aria-hidden />
        <div>
          <p className="font-semibold text-slate-900">{currentCategoryMeta.description}</p>
          <p className="mt-0.5 text-slate-500">{currentCategoryMeta.tooltip}</p>
        </div>
      </div>

      {/* Leaderboard Table / List */}
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No partners meet the criteria for this category and filter yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEntries.map((entry, idx) => {
              const p = entry.partner;
              const rankBadgeTone =
                idx === 0 ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" :
                idx === 1 ? "bg-slate-100 text-slate-800 border-slate-300 font-bold" :
                idx === 2 ? "bg-amber-50 text-amber-800 border-amber-200 font-bold" :
                "bg-slate-50 text-slate-500 border-slate-200 font-semibold";

              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs ${rankBadgeTone}`}
                    >
                      {idx + 1}
                    </span>

                    {/* Initial / Avatar */}
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--orbit-primary)]/10 font-bold text-[var(--orbit-primary)] text-sm">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Partner Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/partners/${p.slug}`}
                          className="truncate text-sm font-bold text-slate-900 hover:text-[var(--orbit-primary)] hover:underline"
                        >
                          {p.name}
                        </Link>
                        {p.isFounding && <Badge tone="amber">Pilot</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{p.statusLabel}</span>
                        <span>·</span>
                        <span>{p.city}</span>
                        {p.metrics.streak.currentStreak >= 2 && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-amber-700">
                              🔥 {p.metrics.streak.currentStreak} wk streak
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Primary Metric & CTA */}
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-950">{entry.primaryValue}</p>
                      <p className="text-xs text-slate-500">{entry.secondaryValue}</p>
                    </div>

                    <Link
                      href={`/partners/${p.slug}`}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--orbit-primary)] hover:bg-[var(--orbit-primary)]/10 transition-colors"
                    >
                      <span>Profile</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
