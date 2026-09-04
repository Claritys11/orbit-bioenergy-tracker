"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { WeeklyHeatmapCell } from "@/lib/domain/partner-recognition";

interface ContributionCalendarProps {
  heatmap: WeeklyHeatmapCell[];
}

const intensityColors: Record<number, string> = {
  0: "bg-slate-100 border-slate-200 text-slate-400",
  1: "bg-emerald-100 border-emerald-300 text-emerald-800",
  2: "bg-emerald-300 border-emerald-400 text-emerald-950 font-bold",
  3: "bg-emerald-500 border-emerald-600 text-white font-bold",
  4: "bg-emerald-600 border-emerald-700 text-white font-bold",
};

export function ContributionCalendar({ heatmap }: ContributionCalendarProps) {
  const [selectedCell, setSelectedCell] = useState<WeeklyHeatmapCell | null>(
    heatmap[heatmap.length - 1] || null,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Weekly Contribution Activity</h3>
          <p className="text-xs text-slate-500">
            Visualizing regular source-sorting consistency over the last 12 weeks (ISO calendar weeks).
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>Less regular</span>
          <div className="flex items-center gap-1 mx-1">
            <span className="h-3 w-3 rounded-sm bg-slate-100 border border-slate-200" />
            <span className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-300" />
            <span className="h-3 w-3 rounded-sm bg-emerald-300 border border-emerald-400" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500 border border-emerald-600" />
            <span className="h-3 w-3 rounded-sm bg-emerald-600 border border-emerald-700" />
          </div>
          <span>Consistently clean</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 min-w-[500px]">
          {heatmap.map((cell) => {
            const isSelected = selectedCell?.isoWeek === cell.isoWeek;
            return (
              <button
                key={cell.isoWeek}
                type="button"
                onClick={() => setSelectedCell(cell)}
                className={`group flex flex-col items-center justify-between rounded-lg border p-2.5 text-center transition-all ${
                  intensityColors[cell.intensity]
                } ${isSelected ? "ring-2 ring-[var(--orbit-primary)] shadow-sm scale-105" : "hover:scale-102"}`}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-80">{cell.weekLabel}</span>
                <span className="my-1 text-sm font-extrabold">
                  {cell.contributionCount > 0 ? cell.contributionCount : "—"}
                </span>
                <span className="text-[9px] opacity-75">
                  {cell.contributionCount > 0 ? `${cell.acceptedMassKg}kg` : "Idle"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Week Detail Card */}
      {selectedCell && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-[var(--orbit-primary)] shrink-0" />
            <span>
              <strong className="text-slate-900">Week of {selectedCell.weekLabel} ({selectedCell.isoWeek}):</strong>{" "}
              {selectedCell.contributionCount > 0 ? (
                <span className="text-slate-700">
                  {selectedCell.contributionCount} verified load(s) · {selectedCell.acceptedMassKg} kg accepted · {selectedCell.averageAcceptanceRate}% acceptance
                </span>
              ) : (
                <span className="text-slate-500">No verified feedstock contributions logged in this week.</span>
              )}
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-semibold text-slate-400">
            Click week to inspect
          </span>
        </div>
      )}
    </div>
  );
}
