"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { createPickupRequestFormAction } from "@/app/actions";
import { Button, Card, DataConfidenceBadge, Field, TextareaField } from "@/components/ui";

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
    readyBatches.map((b) => b.id), // Default select all ready batches
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState<number>(0);
  const [isPending, setIsPending] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
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
      setError("Please select at least one ready container load for pickup.");
      return;
    }

    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    selectedIds.forEach((id) => formData.append("batchIds", id));
    const count = selectedIds.length;

    try {
      const res = await createPickupRequestFormAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(res.message ?? "Pickup request successfully dispatched to logistics.");
        setCreatedCount(count);
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
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--orbit-primary)] text-white font-bold">
            <CalendarCheck size={18} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950">
              Create School Pickup Request
            </h2>
            <p className="text-xs text-slate-500">
              Group accumulated ready canteen containers and dispatch collection demand to the operator.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white font-bold shrink-0">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">✓ Pickup Request Dispatched</h3>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                <strong>{createdCount} container load(s)</strong> are now grouped into this pickup request.
                The logistics operator will review and assign a vehicle.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 border border-emerald-200 hover:bg-slate-50"
                >
                  Create Another Request
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {readyBatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
          <Clock size={28} className="mx-auto text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No containers are ready yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            When the canteen team marks a reusable organic drum ready, it will appear here for collection scheduling.
          </p>
          <div className="mt-4">
            <Link
              href="/batches"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Container History
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ready Containers ({selectedIds.length} of {readyBatches.length} selected)
              </label>
              <div className="flex items-center gap-2 text-xs">
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
                  Deselect all
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-2xs">
              {readyBatches.map((batch) => {
                const isSelected = selectedIds.includes(batch.id);
                return (
                  <label
                    key={batch.id}
                    className={`flex cursor-pointer items-center justify-between p-3.5 transition-colors ${
                      isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(batch.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--orbit-primary)] focus:ring-[var(--orbit-primary)]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {batch.batchCode}
                          </p>
                          {batch.container ? (
                            <span className="font-mono text-[11px] font-semibold text-slate-500">
                              ({batch.container.containerCode})
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500">{batch.category.name}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right ml-2">
                      <DataConfidenceBadge level="UNVERIFIED" className="text-[9px] py-0 px-1.5" />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs">
            <div>
              <span className="text-slate-600">Selected for collection: </span>
              <span className="font-bold text-slate-950">
                {selectedIds.length} container load(s)
              </span>
            </div>
            <div>
              <span className="text-slate-600">Facility weighing: </span>
              <span className="font-bold text-emerald-800">Upon arrival</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
            label="Logistics & Gate Notes (Optional)"
            name="notes"
            placeholder="e.g. Please collect behind the South Canteen sorting bay near Gate 2."
          />

          <Button
            type="submit"
            disabled={isPending || selectedIds.length === 0}
            className="w-full min-h-11 text-xs sm:text-sm font-bold shadow-xs"
          >
            {isPending
              ? "Submitting Pickup Request..."
              : `✓ Dispatch Request for ${selectedIds.length} Container Load(s)`}
          </Button>
        </form>
      )}
    </Card>
  );
}
