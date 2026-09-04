"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { createConversionFormAction } from "@/app/actions";
import { Button, DataConfidenceBadge, Field, SelectField, TextareaField } from "@/components/ui";
import { formatGas, formatKg } from "@/lib/utils";

interface AcceptedBatch {
  id: string;
  batchCode: string;
  sourceOrganisationName: string;
  acceptedMassKg: number;
  yieldFactor: number;
}

interface FacilityOption {
  id: string;
  name: string;
}

export function ConversionForm({
  facilities,
  batches,
}: {
  facilities: FacilityOption[];
  batches: AcceptedBatch[];
}) {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(
    batches.slice(0, 2).map((b) => b.id),
  );
  const [measuredGas, setMeasuredGas] = useState<number | "">("");

  const selectedBatches = batches.filter((b) => selectedBatchIds.includes(b.id));
  const totalAcceptedMass = selectedBatches.reduce((sum, b) => sum + b.acceptedMassKg, 0);
  const totalEstimatedGas = selectedBatches.reduce(
    (sum, b) => sum + b.acceptedMassKg * b.yieldFactor,
    0,
  );

  const measuredNum = typeof measuredGas === "number" ? measuredGas : 0;
  const netAllocatableGas = Math.max(0, measuredNum - 0.4);
  const schoolBenefit = Number((netAllocatableGas * 0.5).toFixed(2));
  const facilityBenefit = Number((netAllocatableGas * 0.3).toFixed(2));
  const contributorBenefit = Number((netAllocatableGas * 0.2).toFixed(2));

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  }

  function selectAll() {
    setSelectedBatchIds(batches.map((b) => b.id));
  }

  function deselectAll() {
    setSelectedBatchIds([]);
  }

  return (
    <form action={createConversionFormAction} className="mt-4 grid gap-5">
      <SelectField
        label="Processing Facility / Biodigester"
        name="facilityId"
        required
        options={facilities.map((facility) => ({
          value: facility.id,
          label: facility.name,
        }))}
      />

      <fieldset className="grid gap-2 rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
        <div className="flex items-center justify-between">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-600">
            Select Accepted Feedstock Batches ({selectedBatchIds.length} of {batches.length} selected)
          </legend>
          <div className="space-x-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="font-semibold text-[var(--orbit-primary)] hover:underline"
            >
              Select all
            </button>
            <span className="text-slate-300">&bull;</span>
            <button
              type="button"
              onClick={deselectAll}
              className="font-semibold text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {batches.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No accepted or conditional batches currently awaiting anaerobic conversion.
          </p>
        ) : (
          <div className="mt-2 max-h-52 overflow-y-auto divide-y divide-slate-100 pr-1">
            {batches.map((batch) => {
              const checked = selectedBatchIds.includes(batch.id);
              return (
                <label
                  key={batch.id}
                  className={`flex cursor-pointer items-center justify-between py-2.5 px-2 rounded-lg text-xs transition-colors ${
                    checked ? "bg-[var(--orbit-primary)]/8" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      name="batchIds"
                      value={batch.id}
                      checked={checked}
                      onChange={() => toggleBatch(batch.id)}
                      className="rounded border-slate-300 text-[var(--orbit-primary)] focus:ring-[var(--orbit-primary)]"
                    />
                    <span className="font-bold text-slate-900 truncate">{batch.batchCode}</span>
                    <span className="text-slate-500 text-[11px] truncate">({batch.sourceOrganisationName})</span>
                  </div>
                  <div className="font-extrabold text-emerald-800 shrink-0 ml-2">
                    {formatKg(batch.acceptedMassKg)}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Input Summary & Model Estimate */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">Total Organic Feedstock</p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
            {formatKg(totalAcceptedMass)}
          </p>
          <p className="text-[11px] text-slate-500">{selectedBatches.length} batch(es) selected</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-slate-500">ORBIT Model Estimate</p>
            <DataConfidenceBadge level="ESTIMATED" className="text-[9px] py-0 px-1.5" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[var(--orbit-primary)]">
            {formatGas(totalEstimatedGas)}
          </p>
          <p className="text-[11px] text-slate-500">Theoretical yield before physical meter log</p>
        </div>
      </div>

      {/* Measured Physical Gas Output */}
      <div className="rounded-xl border-2 border-emerald-500/40 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
              Physical Flow Meter Reading
            </span>
            <p className="text-xs text-slate-500">
              Enter the certified physical volume from the facility gas meter.
            </p>
          </div>
          <DataConfidenceBadge level="VERIFIED_BIOGAS" />
        </div>

        <Field
          label="Measured Gas Output (m³)"
          name="measuredGasM3"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="e.g. 5.20"
          value={measuredGas}
          onChange={(e) => setMeasuredGas(e.target.value === "" ? "" : Number(e.target.value))}
          hint="From facility physical flow meter"
        />
        {/* Mirror to verifiedGasM3 for schema compatibility */}
        <input type="hidden" name="verifiedGasM3" value={measuredGas} />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Facility O&M Gas (m³)"
            name="operationalUseM3"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0.20"
            required
            hint="Hub operational burner"
          />
          <Field
            label="Safety Reserve (m³)"
            name="safetyReserveM3"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0.20"
            required
            hint="Pressure buffer reserve"
          />
        </div>

        <div>
          <Field
            label="Digestate Output (kg)"
            name="digestateOutputKg"
            type="number"
            step="0.1"
            min="0"
            defaultValue={(totalAcceptedMass * 0.4).toFixed(1)}
            required
            hint="Organic fertilizer by-product"
          />
        </div>
      </div>

      {/* Automatic Allocation Preview (Section 22) */}
      {measuredNum > 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-700" />
              ORBIT Automatic Allocation (Policy: 50 / 30 / 20)
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Net: {formatGas(netAllocatableGas)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-emerald-100">
              <p className="text-[10px] text-slate-500 font-semibold">School Benefit (50%)</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">{formatGas(schoolBenefit)}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-emerald-100">
              <p className="text-[10px] text-slate-500 font-semibold">Facility / O&M (30%)</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">{formatGas(facilityBenefit)}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-emerald-100">
              <p className="text-[10px] text-slate-500 font-semibold">Contributors (20%)</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">{formatGas(contributorBenefit)}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-emerald-700">
            Automatically distributed according to the registered allocation policy.
          </p>
        </div>
      ) : null}

      <SelectField
        label="Measurement Verification Source"
        name="measurementSource"
        required
        options={[
          { value: "MANUAL", label: "Manual Physical Log (calibrated flow meter)" },
          { value: "SENSOR_VERIFIED", label: "Sensor Verified Log (telemetry linked)" },
          { value: "SENSOR_SIMULATED", label: "Demonstration / Simulated Meter" },
        ]}
      />

      <TextareaField
        label="Conversion Notes"
        name="notes"
        defaultValue="Physical conversion cycle recorded by Community Facility personnel with calibrated flow meter verification."
      />

      <Button
        disabled={selectedBatches.length === 0 || measuredGas === ""}
        className="w-full min-h-12 text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
      >
        ✓ Verify Conversion Output & Generate Allocation
      </Button>
    </form>
  );
}
