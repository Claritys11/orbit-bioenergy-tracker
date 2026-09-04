"use client";

import { useState } from "react";
import Link from "next/link";
import { receiveContainerAction } from "@/app/actions";
import { Badge, Button, Card, Field } from "@/components/ui";

export function ContainerReceiver() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receivedResult, setReceivedResult] = useState<{
    containerCode?: string;
    batchCode?: string;
    organisationName?: string;
    batchId?: string | null;
    message?: string;
  } | null>(null);

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setReceivedResult(null);

    try {
      const res = await receiveContainerAction(code.trim());
      if ("error" in res && res.error) {
        setError(res.error);
      } else if (res.success) {
        setReceivedResult(res);
        setCode("");
      }
    } catch {
      setError("An unexpected error occurred while receiving container.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Receive Container at Facility</h2>
          <Badge tone="green">Community Facility</Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Enter reusable container code or scan tag token upon arrival from logistics delivery.
        </p>

        <form onSubmit={handleReceive} className="mt-4 grid gap-4">
          <Field
            label="Reusable Container Code or QR Token"
            name="code"
            required
            placeholder="e.g. CNT-MALANG-001 or token UUID"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

          <Button disabled={loading}>
            {loading ? "Identifying..." : "Mark Container Received"}
          </Button>
        </form>

        {receivedResult ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">✓ Container Identified & Received</span>
              <Badge tone="green">Ready for Inspection</Badge>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-700">
              <p>Container: <strong className="text-slate-900">{receivedResult.containerCode}</strong></p>
              {receivedResult.organisationName ? (
                <p>Source Organisation: <strong className="text-slate-900">{receivedResult.organisationName}</strong></p>
              ) : null}
              {receivedResult.batchCode ? (
                <p>Active Batch: <strong className="text-slate-900">{receivedResult.batchCode}</strong></p>
              ) : null}
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href="/operations/inspections"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--orbit-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90"
              >
                Proceed to Weighing & Inspection →
              </Link>
            </div>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Facility Receiving Guidelines</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-4 text-xs text-slate-600 leading-relaxed">
          <li>
            <strong className="text-slate-900">Verify Physical Tag:</strong> Match the reusable container identity tag on the plastic drum with the logistics manifest.
          </li>
          <li>
            <strong className="text-slate-900">Mark Received:</strong> Receiving transitions the batch to <span className="font-semibold text-slate-800">DELIVERED</span> and container to <span className="font-semibold text-slate-800">AT_FACILITY</span>.
          </li>
          <li>
            <strong className="text-slate-900">Calibrated Weighing:</strong> Move to Community Inspection to record actual measured gross mass and contaminant mass.
          </li>
          <li>
            <strong className="text-slate-900">Container Re-circulation:</strong> Once inspected and emptied into the digester hopper, the container status returns to AVAILABLE for the school.
          </li>
        </ol>
      </Card>
    </div>
  );
}
