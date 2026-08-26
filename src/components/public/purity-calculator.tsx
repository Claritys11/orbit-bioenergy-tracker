"use client";

import { useMemo, useState } from "react";
import { calculateContamination } from "@/lib/domain/contamination";
import { Badge, Card } from "@/components/ui";

export function PurityCalculator() {
  const [gross, setGross] = useState(20);
  const [rejected, setRejected] = useState(1);
  const result = useMemo(
    () =>
      calculateContamination({
        verifiedGrossMassKg: Math.max(0.1, gross),
        rejectedMassKg: Math.min(Math.max(0, rejected), gross),
        warningThresholdPercent: 8,
        rejectThresholdPercent: 30,
      }),
    [gross, rejected],
  );
  const score = result.acceptedMassKg * result.qualityFactor;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Educational purity simulation</h3>
          <p className="mt-1 text-sm text-slate-600">This is not verified facility output.</p>
        </div>
        <Badge tone="amber">Pilot Assumption</Badge>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Gross mass: {gross} kg
          <input type="range" min="1" max="60" value={gross} onChange={(event) => setGross(Number(event.target.value))} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Rejected mass: {rejected} kg
          <input type="range" min="0" max={gross} value={rejected} onChange={(event) => setRejected(Number(event.target.value))} />
        </label>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div><p className="text-sm text-slate-500">Accepted</p><p className="text-xl font-bold">{result.acceptedMassKg.toFixed(1)} kg</p></div>
        <div><p className="text-sm text-slate-500">Contamination</p><p className="text-xl font-bold">{result.contaminationRate.toFixed(1)}%</p></div>
        <div><p className="text-sm text-slate-500">Classification</p><p className="text-xl font-bold">{result.decision}</p></div>
        <div><p className="text-sm text-slate-500">Relative score</p><p className="text-xl font-bold">{score.toFixed(2)}</p></div>
      </div>
    </Card>
  );
}
