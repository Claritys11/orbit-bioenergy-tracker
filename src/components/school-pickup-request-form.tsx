"use client";

import { useState } from "react";
import { createPickupRequestFormAction } from "@/app/actions";
import { Button, Card, Field, TextareaField } from "@/components/ui";
import { formatKg } from "@/lib/utils";

type ReadyBatch = {
  id: string;
  batchCode: string;
  grossWeightKg?: number | null;
  declaredMassKg?: number | null;
  createdAt: Date | string;
  container?: { containerCode: string } | null;
  category: { name: string };
};

export function SchoolPickupRequestForm({ readyBatches }: { readyBatches: ReadyBatch[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    readyBatches.map((b) => b.id) // Default select all ready batches
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const selectedBatches = readyBatches.filter((b) => selectedIds.includes(b.id));
  const totalWeight = selectedBatches.reduce((acc, b) => acc + (b.grossWeightKg ?? b.declaredMassKg ?? 0), 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(readyBatches.map((b) => b.id));
  const deselectAll = () => setSelectedIds([]);

  const [defaultStart] = useState(() => new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16));
  const [defaultEnd] = useState(() => new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (selectedIds.length === 0) {
      setError("Please select at least one ready container/batch for pickup.");
      return;
    }

    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    selectedIds.forEach((id) => formData.append("batchIds", id));

    try {
      const res = await createPickupRequestFormAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(res.message ?? "Pickup request created!");
        setSelectedIds([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create pickup request.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="grid gap-5">
      <div>
        <h2 className="text-lg font-bold text-black">Create School Pickup Request</h2>
        <p className="text-sm text-slate-500">
          Select accumulated ready organic waste containers and propose a collection date/time window for the bioenergy operator.
        </p>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          {success}
        </div>
      ) : null}

      {readyBatches.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No ready waste batches currently waiting for pickup. Scan container QR codes in your canteen to register today&apos;s organic waste.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Ready Containers / Batches ({selectedIds.length} of {readyBatches.length} selected)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="font-semibold text-[var(--orbit-primary)] hover:underline"
                >
                  Select all
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="font-semibold text-slate-500 hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
              {readyBatches.map((batch) => {
                const isSelected = selectedIds.includes(batch.id);
                return (
                  <label
                    key={batch.id}
                    className={`flex cursor-pointer items-center justify-between p-3 transition hover:bg-slate-50 ${
                      isSelected ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(batch.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--orbit-primary)] focus:ring-[var(--orbit-primary)]"
                      />
                      <div>
                        <p className="font-bold text-sm text-black">
                          {batch.batchCode}
                          {batch.container ? (
                            <span className="ml-2 font-mono text-xs text-slate-500">
                              ({batch.container.containerCode})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-500">{batch.category.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[var(--orbit-primary)]">
                        {formatKg(batch.grossWeightKg)}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between rounded-md bg-blue-50/60 p-4 text-sm">
            <div>
              <span className="text-slate-600">Total Selected Items: </span>
              <span className="font-bold text-black">{selectedIds.length} ready bags/containers</span>
            </div>
            <div>
              <span className="text-slate-600">Total Declared Weight: </span>
              <span className="font-extrabold text-[var(--orbit-primary)]">{formatKg(totalWeight)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Proposed Pickup Start Window"
              name="proposedPickupStart"
              type="datetime-local"
              required
              defaultValue={defaultStart}
            />
            <Field
              label="Proposed Pickup End Window"
              name="proposedPickupEnd"
              type="datetime-local"
              required
              defaultValue={defaultEnd}
            />
          </div>

          <TextareaField
            label="Logistics & Location Notes (Optional)"
            name="notes"
            placeholder="e.g. Please pick up behind the South Canteen sorting bay near Gate 2."
          />

          <Button type="submit" disabled={isPending || selectedIds.length === 0}>
            {isPending ? "Submitting Pickup Request..." : `Submit Request for ${selectedIds.length} Container Load(s)`}
          </Button>
        </form>
      )}
    </Card>
  );
}
