"use client";

import { useState } from "react";
import { inspectBatchFormAction } from "@/app/actions";
import { AlertBanner, Badge, Button, Field, SelectField, TextareaField } from "@/components/ui";
import { CheckCircle2, Scale } from "lucide-react";

interface DeliveredBatch {
  id: string;
  batchCode: string;
  sourceOrganisationName: string;
  containerCode?: string | null;
  arrivedAt?: string;
}

export function InspectionForm({
  batches,
  initialBatchId,
}: {
  batches: DeliveredBatch[];
  initialBatchId?: string;
}) {
  const [selectedBatchId, setSelectedBatchId] = useState(() => {
    if (initialBatchId && batches.some((b) => b.id === initialBatchId)) {
      return initialBatchId;
    }
    return batches[0]?.id ?? "";
  });

  const [verifiedGross, setVerifiedGross] = useState<number | "">("");
  const [rejectedMass, setRejectedMass] = useState<number | "">("");
  const [categories, setCategories] = useState<string[]>(["Packaging"]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const grossNum = typeof verifiedGross === "number" ? verifiedGross : 0;
  const rejectedNum = typeof rejectedMass === "number" ? rejectedMass : 0;

  // Validation: rejected cannot exceed gross
  const isRejectedExceeded = grossNum > 0 && rejectedNum > grossNum;
  const acceptedMass = grossNum > 0 && !isRejectedExceeded ? Math.max(0, Number((grossNum - rejectedNum).toFixed(1))) : 0;
  const contaminationRate = grossNum > 0 && !isRejectedExceeded ? Number(((rejectedNum / grossNum) * 100).toFixed(1)) : 0;

  let decision = "PENDING";
  if (grossNum > 0 && !isRejectedExceeded) {
    if (contaminationRate > 30) {
      decision = "REJECTED";
    } else if (contaminationRate >= 8) {
      decision = "CONDITIONAL";
    } else {
      decision = "ACCEPTED";
    }
  }

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
        <Scale className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="font-bold text-slate-800 text-sm">No delivered batches awaiting inspection</p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Batches must be confirmed DELIVERED by the logistics driver or received via container scan before calibrated inspection.
        </p>
      </div>
    );
  }

  return (
    <form action={inspectBatchFormAction} className="mt-4 grid gap-4">
      <SelectField
        label="Select Delivered Batch *"
        name="batchId"
        required
        value={selectedBatchId}
        onChange={(e) => setSelectedBatchId(e.target.value)}
        options={batches.map((batch) => ({
          value: batch.id,
          label: `${batch.batchCode} — ${batch.sourceOrganisationName} ${batch.containerCode ? `[${batch.containerCode}]` : ""}`,
        }))}
      />

      {selectedBatch ? (
        <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Container Tag: <strong className="text-slate-900">{selectedBatch.containerCode ?? "Standard Bin"}</strong></span>
            <span>Origin: <strong className="text-slate-900">{selectedBatch.sourceOrganisationName}</strong></span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Verified Gross Weight (kg) *"
          name="verifiedGrossMassKg"
          type="number"
          step="0.1"
          min="0.1"
          required
          placeholder="e.g. 20.0 (Scale reading)"
          value={verifiedGross}
          onChange={(e) => setVerifiedGross(e.target.value === "" ? "" : Number(e.target.value))}
        />
        <Field
          label="Rejected / Contaminant Weight (kg) *"
          name="rejectedMassKg"
          type="number"
          step="0.1"
          min="0"
          required
          placeholder="e.g. 2.0 (Plastic, metal, etc.)"
          value={rejectedMass}
          onChange={(e) => setRejectedMass(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>

      {/* Friendly Inline Error Prevention */}
      {isRejectedExceeded ? (
        <AlertBanner tone="error" title="Input Error">
          Rejected weight ({rejectedNum} kg) cannot be greater than the verified gross weight ({grossNum} kg). Please verify physical scale readings.
        </AlertBanner>
      ) : null}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Contamination Categories Separated
        </label>
        <div className="flex flex-wrap gap-2">
          {["Plastic", "Metal", "Packaging", "Excess Liquid", "Other Non-Organic"].map((cat) => {
            const checked = categories.includes(cat);
            return (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  checked
                    ? "border-[var(--orbit-primary)] bg-[var(--orbit-primary)] text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {checked ? "✓ " : ""}{cat}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="contaminationCategories" value={categories.join(", ") || "None"} />
      </div>

      {/* System Calculated Box */}
      <div className="rounded-xl border border-[var(--orbit-primary)]/30 bg-blue-50/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--orbit-primary)]">
            ORBIT Automated Calculation
          </p>
          <Badge tone="blue">Real-Time</Badge>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white p-3 shadow-xs border border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Accepted Organics</p>
            <p className="mt-1 text-xl font-black text-slate-900">{acceptedMass} kg</p>
            <p className="text-[10px] text-slate-400">Gross - Rejected</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-xs border border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Contamination</p>
            <p className="mt-1 text-xl font-black text-slate-900">{contaminationRate}%</p>
            <p className="text-[10px] text-slate-400">Purity: {100 - contaminationRate}%</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-xs border border-slate-200 flex flex-col justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Decision</p>
            <span
              className={`inline-block rounded-md px-2 py-1 text-xs font-black ${
                decision === "ACCEPTED"
                  ? "bg-emerald-100 text-emerald-900"
                  : decision === "CONDITIONAL"
                  ? "bg-amber-100 text-amber-900"
                  : decision === "REJECTED"
                  ? "bg-red-100 text-red-900"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {decision}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {decision === "ACCEPTED" ? "< 8% Pure (Full Yield)" : decision === "CONDITIONAL" ? "8%–30% Quality Adjusted" : "≥ 30% Ineligible"}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden default fields preserved for domain validation */}
      <input type="hidden" name="conditionFactor" value="0.95" />
      <input type="hidden" name="feedstockCondition" value="Fresh, source-separated, sorted at community facility." />

      <TextareaField
        label="Community Facility Inspection Notes"
        name="notes"
        defaultValue="Facility physical weighing and sorting confirmed. Net accepted organics ready for biodigester."
      />

      <Button
        className="min-h-12 w-full font-black text-sm"
        disabled={isRejectedExceeded || grossNum <= 0}
      >
        <CheckCircle2 size={18} /> Confirm Verified Inspection
      </Button>
    </form>
  );
}
