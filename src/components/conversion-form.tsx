"use client";

import { useState } from "react";
import { createConversionFormAction } from "@/app/actions";
import { Button, Field, SelectField, TextareaField } from "@/components/ui";
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
    <form action={createConversionFormAction} className="mt-4 grid gap-4">
      <SelectField
        label="Processing Facility"
        name="facilityId"
        required
        options={facilities.map((facility) => ({
          value: facility.id,
          label: facility.name,
        }))}
      />

      <fieldset className="grid gap-2 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-600">
            Select Accepted Feedstock Batches
          </legend>
          <div className="space-x-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-[var(--orbit-primary)] hover:underline"
            >
              Select all
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {batches.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            No accepted/conditional inspected batches currently awaiting conversion.
          </p>
        ) : (
          <div className="mt-2 max-h-52 overflow-y-auto divide-y divide-slate-100 pr-1">
            {batches.map((batch) => {
              const checked = selectedBatchIds.includes(batch.id);
              return (
                <label
                  key={batch.id}
                  className={`flex cursor-pointer items-center justify-between py-2 px-2 rounded text-xs transition-colors ${
                    checked ? "bg-[var(--orbit-primary)]/8" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="batchIds"
                      value={batch.id}
                      checked={checked}
                      onChange={() => toggleBatch(batch.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="font-semibold text-slate-900">{batch.batchCode}</span>
                    <span className="text-slate-500">({batch.sourceOrganisationName})</span>
                  </div>
                  <div className="font-medium text-slate-700">
                    {formatKg(batch.acceptedMassKg)}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Input Summary & Model Estimate */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Input Feedstock Organics</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">
            {formatKg(totalAcceptedMass)}
          </p>
          <p className="text-[11px] text-slate-500">{selectedBatches.length} batch(es) selected</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-slate-500">ORBIT Estimated Gas</p>
            <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
              Estimated
            </span>
          </div>
          <p className="mt-1 text-xl font-extrabold text-[var(--orbit-primary)]">
            {formatGas(totalEstimatedGas)}
          </p>
          <p className="text-[11px] text-slate-500">Calculated from feedstock yield factors</p>
        </div>
      </div>

      {/* Measured Physical Output */}
      <div className="rounded-xl border-2 border-[var(--orbit-primary)]/30 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Physical Gas Measurement (Facility Meter Log)
          </label>
          <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
            Verified Output
          </span>
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
        />
        {/* Mirror to verifiedGasM3 for schema compatibility */}
        <input type="hidden" name="verifiedGasM3" value={measuredGas} />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field
            label="Facility Operational Use (m³)"
            name="operationalUseM3"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0.20"
            required
          />
          <Field
            label="Safety Reserve (m³)"
            name="safetyReserveM3"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0.20"
            required
          />
        </div>

        <div className="mt-3">
          <Field
            label="Digestate Output (kg)"
            name="digestateOutputKg"
            type="number"
            step="0.1"
            min="0"
            defaultValue={(totalAcceptedMass * 0.4).toFixed(1)}
            required
          />
        </div>
      </div>

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

      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
        <p className="font-semibold">⚡ Automatic Allocation Generation</p>
        <p className="mt-0.5 text-[11px] text-emerald-700">
          Upon verifying this conversion cycle, ORBIT will automatically calculate and allocate allocatable biogas to contributing schools and community facility based on accepted organic mass and purity scores.
        </p>
      </div>

      <TextareaField
        label="Conversion Notes"
        name="notes"
        defaultValue="Verified conversion cycle recorded by Community Facility personnel."
      />

      <Button disabled={selectedBatches.length === 0 || measuredGas === ""}>
        Verify Conversion Output & Generate Allocation
      </Button>
    </form>
  );
}
