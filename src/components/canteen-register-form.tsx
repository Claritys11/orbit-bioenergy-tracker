"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Recycle } from "lucide-react";
import { createBatchFormAction } from "@/app/actions";
import { Button, Card, SelectField } from "./ui";

interface ContainerItem {
  id: string;
  containerCode: string;
  capacityKg?: number | null;
  status: string;
  source: { id: string; name: string };
  category: { id: string; name: string; yieldFactor: number };
}

interface SourceItem {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
  yieldFactor: number;
}

export function CanteenRegisterForm({
  containers,
  sources,
  categories,
  preselectedContainerId,
}: {
  containers: ContainerItem[];
  sources: SourceItem[];
  categories: CategoryItem[];
  preselectedContainerId?: string;
}) {
  const [selectedContainerId, setSelectedContainerId] = useState<string>(
    preselectedContainerId ?? (containers[0]?.id ?? ""),
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    batchCode?: string;
    containerCode?: string;
    message?: string;
  } | null>(null);

  const selectedContainer = containers.find((c) => c.id === selectedContainerId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // If a container is selected, auto-fill sourceId and categoryId if missing
    if (selectedContainer) {
      formData.set("containerId", selectedContainer.id);
      formData.set("sourceId", selectedContainer.source.id);
      formData.set("categoryId", selectedContainer.category.id);
    }

    // Default required fields for schema integrity
    if (!formData.get("storageStatus")) {
      formData.set("storageStatus", "Covered canteen bay drum");
    }
    if (!formData.get("collectionTimestamp")) {
      formData.set("collectionTimestamp", new Date().toISOString());
    }

    try {
      await createBatchFormAction(formData);
      setSuccessResult({
        containerCode: selectedContainer?.containerCode ?? "Container",
        message: "Your container has been marked ready for school pickup.",
      });
    } catch (err: unknown) {
      // In Next.js redirect from server action can throw NEXT_REDIRECT
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        setSuccessResult({
          containerCode: selectedContainer?.containerCode ?? "Container",
        });
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to register waste container.");
    } finally {
      setIsPending(false);
    }
  }

  if (successResult) {
    return (
      <Card className="max-w-xl mx-auto border-emerald-200 bg-emerald-50/40 p-8 text-center shadow-xs">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs mx-auto">
          <CheckCircle2 size={30} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-emerald-950">✓ Ready for Pickup</h2>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">
          <strong>{successResult.containerCode}</strong> has been registered.
          The logistics operator will transport it, and the Community Facility will measure its verified weight on calibrated scales.
        </p>

        <div className="mt-4 rounded-lg bg-white p-3 border border-emerald-100 text-xs text-slate-600">
          <span className="font-semibold text-emerald-800">What happens next:</span>
          <p className="mt-0.5">School Admin will group this container into a collection pickup request.</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/batches"
            className="rounded-lg bg-[var(--orbit-primary)] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90"
          >
            View My Waste History
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccessResult(null);
              setError(null);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Register Another Drum
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--orbit-primary)] text-white">
            <Recycle size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Mark Waste Container Ready</h2>
            <p className="text-xs text-slate-500">
              1-click operation. Official weighing is performed upon facility delivery.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 grid gap-5">
        {/* Rapid Container Selection Cards */}
        {containers.length > 0 ? (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Select Reusable Container ({containers.length} assigned)
            </label>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {containers.map((c) => {
                const isSelected = selectedContainerId === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedContainerId(c.id)}
                    className={`flex flex-col text-left rounded-xl p-3.5 border transition-all ${
                      isSelected
                        ? "border-[var(--orbit-primary)] bg-[var(--orbit-primary)]/5 ring-2 ring-[var(--orbit-primary)]/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[var(--orbit-primary)]">
                        {c.containerCode}
                      </span>
                      {isSelected ? (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--orbit-primary)] text-white text-[10px]">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {c.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900">{c.category.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Location: {c.source.name}</p>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="containerId" value={selectedContainerId} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Waste Source"
              name="sourceId"
              options={sources.map((s) => ({ value: s.id, label: s.name }))}
            />
            <SelectField
              label="Feedstock Category"
              name="categoryId"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        )}

        {/* Informative Confidence Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Clock size={14} className="text-slate-500" />
            <span>Facility Measurement Guarantee</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            You do not need to weigh this container. ORBIT records source registrations as{" "}
            <span className="font-bold text-slate-700">UNVERIFIED</span>. When the delivery arrives at the facility, calibrated scales record the certified gross and accepted organic mass.
          </p>
        </div>

        {/* Hidden Technical Defaults */}
        <input
          type="hidden"
          name="collectionTimestamp"
          value={new Date().toISOString().slice(0, 16)}
        />
        <input
          type="hidden"
          name="storageStatus"
          value="Covered canteen bay drum"
        />

        <Button
          type="submit"
          disabled={isPending || (!selectedContainerId && containers.length > 0)}
          className="w-full min-h-12 text-sm font-bold shadow-xs"
        >
          {isPending ? "Registering Container..." : "✓ Mark Container Ready for Pickup"}
        </Button>
      </form>
    </Card>
  );
}
