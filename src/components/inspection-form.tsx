"use client";

import { useState } from "react";
import { inspectBatchFormAction } from "@/app/actions";
import { Button, Field, SelectField, TextareaField } from "@/components/ui";

interface DeliveredBatch {
  id: string;
  batchCode: string;
  sourceOrganisationName: string;
  containerCode?: string | null;
  arrivedAt?: string;
}

export function InspectionForm({ batches }: { batches: DeliveredBatch[] }) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id ?? "");
  const [verifiedGross, setVerifiedGross] = useState<number | "">("");
  const [rejectedMass, setRejectedMass] = useState<number | "">("");
  const [categories, setCategories] = useState<string[]>(["Packaging"]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const grossNum = typeof verifiedGross === "number" ? verifiedGross : 0;
  const rejectedNum = typeof rejectedMass === "number" ? rejectedMass : 0;
  const acceptedMass = grossNum > 0 ? Math.max(0, Number((grossNum - rejectedNum).toFixed(1))) : 0;
  const contaminationRate = grossNum > 0 ? Number(((rejectedNum / grossNum) * 100).toFixed(1)) : 0;

  let decision = "PENDING";
  if (grossNum > 0) {
    if (contaminationRate > 30 || rejectedNum > grossNum) {
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
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
        <p className="font-semibold text-slate-700">No delivered batches awaiting inspection</p>
        <p className="mt-1 text-xs text-slate-500">
          Batches must be marked DELIVERED by the logistics operator or received via container scan before inspection.
        </p>
      </div>
    );
  }

  return (
    <form action={inspectBatchFormAction} className="mt-4 grid gap-4">
      <SelectField
        label="Select Delivered Batch"
        name="batchId"
        required
        value={selectedBatchId}
        onChange={(e) => setSelectedBatchId(e.target.value)}
        options={batches.map((batch) => ({
          value: batch.id,
          label: `${batch.batchCode} — ${batch.sourceOrganisationName} ${batch.containerCode ? `(${batch.containerCode})` : ""}`,
        }))}
      />

      {selectedBatch ? (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Container: <strong className="text-slate-900">{selectedBatch.containerCode ?? "Unassigned"}</strong></span>
            <span>Source: <strong className="text-slate-900">{selectedBatch.sourceOrganisationName}</strong></span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Verified Gross Weight (kg)"
          name="verifiedGrossMassKg"
          type="number"
          step="0.1"
          min="0"
          required
          placeholder="e.g. 18.4"
          value={verifiedGross}
          onChange={(e) => setVerifiedGross(e.target.value === "" ? "" : Number(e.target.value))}
        />
        <Field
          label="Rejected / Contaminant Weight (kg)"
          name="rejectedMassKg"
          type="number"
          step="0.1"
          min="0"
          required
          placeholder="e.g. 2.1"
          value={rejectedMass}
          onChange={(e) => setRejectedMass(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
          Contamination Found
        </label>
        <div className="flex flex-wrap gap-2">
          {["Plastic", "Metal", "Packaging", "Excess Liquid", "Other Non-Organic"].map((cat) => {
            const checked = categories.includes(cat);
            return (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  checked
                    ? "border-[var(--orbit-primary)] bg-[var(--orbit-primary)]/10 text-[var(--orbit-primary)]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
      <div className="rounded-xl border border-[var(--orbit-primary)]/30 bg-[var(--orbit-primary)]/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--orbit-primary)]">
          System Calculated (Automatic)
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white p-2.5 shadow-xs">
            <p className="text-xs text-slate-500">Accepted Organics</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{acceptedMass} kg</p>
          </div>
          <div className="rounded-lg bg-white p-2.5 shadow-xs">
            <p className="text-xs text-slate-500">Contamination Rate</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{contaminationRate}%</p>
          </div>
          <div className="rounded-lg bg-white p-2.5 shadow-xs">
            <p className="text-xs text-slate-500">Decision</p>
            <span
              className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${
                decision === "ACCEPTED"
                  ? "bg-green-100 text-green-800"
                  : decision === "CONDITIONAL"
                  ? "bg-amber-100 text-amber-800"
                  : decision === "REJECTED"
                  ? "bg-red-100 text-red-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {decision}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden default fields preserved for domain validation */}
      <input type="hidden" name="conditionFactor" value="0.95" />
      <input type="hidden" name="feedstockCondition" value="Fresh, source-separated, sorted at community facility." />
      <TextareaField
        label="Community Facility Notes"
        name="notes"
        defaultValue="Facility physical weighing and sorting confirmed. Net accepted organics ready for biodigester."
      />

      <Button className="w-full">Confirm Inspection</Button>
    </form>
  );
}
