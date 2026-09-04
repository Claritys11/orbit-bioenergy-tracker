"use client";

import { useState } from "react";
import {
  confirmRequestDeliveryAction,
  respondPickupRequestFormAction,
  schedulePickupLogisticsFormAction,
} from "@/app/actions";
import { Badge, Button, Card, Field, SelectField, TextareaField } from "@/components/ui";
import { formatKg, humanise } from "@/lib/utils";

type PickupRequestData = {
  id: string;
  requestCode: string;
  requestedAt: Date | string;
  proposedPickupStart: Date | string;
  proposedPickupEnd: Date | string;
  status: string;
  notes?: string | null;
  rejectionReason?: string | null;
  actualScheduledAt?: Date | string | null;
  schoolOrganisation: { name: string };
  requestedByUser: { name: string };
  items: Array<{
    id: string;
    batch: {
      id: string;
      batchCode: string;
      grossWeightKg?: number | null;
      declaredMassKg?: number | null;
      category: { name: string };
      container?: { containerCode: string } | null;
    };
  }>;
  pickup?: {
    id: string;
    scheduledAt: Date | string;
    routeNotes: string;
    vehicle?: { label: string; plate: string } | null;
  } | null;
};

type VehicleData = {
  id: string;
  label: string;
  plate: string;
};

export function OperatorPickupInbox({
  requests,
  vehicles,
}: {
  requests: PickupRequestData[];
  vehicles: VehicleData[];
}) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const getUrgencyIndicator = (itemCount: number) => {
    if (itemCount <= 1) {
      return { label: "LOW ACCUMULATION", tone: "green" as const, colorClass: "bg-emerald-100 text-emerald-800" };
    }
    if (itemCount <= 5) {
      return { label: "PICKUP RECOMMENDED", tone: "amber" as const, colorClass: "bg-amber-100 text-amber-900" };
    }
    return { label: "HIGH ACCUMULATION / PRIORITY", tone: "red" as const, colorClass: "bg-red-100 text-red-800 border-red-200 font-extrabold animate-pulse" };
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING_OPERATOR_RESPONSE");
  const acceptedRequests = requests.filter((r) => r.status === "ACCEPTED" || r.status === "SCHEDULED" || r.status === "IN_TRANSIT");

  async function handleRespond(requestId: string, decision: "ACCEPT" | "REJECT") {
    setError(null);
    if (decision === "REJECT" && (!rejectionReason || rejectionReason.trim().length < 3)) {
      setError("Please provide a valid rejection reason (at least 3 characters).");
      return;
    }

    setIsPending(true);
    const formData = new FormData();
    formData.append("requestId", requestId);
    formData.append("decision", decision);
    if (decision === "REJECT") {
      formData.append("rejectionReason", rejectionReason);
    }

    try {
      const res = await respondPickupRequestFormAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setRejectingId(null);
        setRejectionReason("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process request response.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* 1. Pending Incoming Requests Section */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-black">Incoming School Pickup Requests</h2>
            <p className="text-sm text-slate-500">
              Review collection demand requested by schools. Accept to schedule logistics or reject with a reason.
            </p>
          </div>
          <span className="rounded-full bg-[var(--orbit-primary)] px-3 py-1 text-xs font-bold text-white">
            {pendingRequests.length} Pending
          </span>
        </div>

        {error ? (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No pending pickup requests at this time.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {pendingRequests.map((req) => {
              const itemCount = req.items.length;
              const totalMass = req.items.reduce((acc, i) => acc + (i.batch.grossWeightKg ?? i.batch.declaredMassKg ?? 0), 0);
              const urgency = getUrgencyIndicator(itemCount);
              const isRejecting = rejectingId === req.id;

              return (
                <div
                  key={req.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--orbit-primary)]/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">{req.requestCode}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${urgency.colorClass}`}>
                          {urgency.label}
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-black">{req.schoolOrganisation.name}</h3>
                      <p className="text-xs text-slate-500">Requested by {req.requestedByUser.name}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-extrabold text-[var(--orbit-primary)]">{totalMass > 0 ? formatKg(totalMass) : "Pending weighing"}</p>
                      <p className="text-xs font-semibold text-slate-600">{itemCount} container load(s)</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                    <p className="font-semibold">Proposed Window:</p>
                    <p>
                      {new Date(req.proposedPickupStart).toLocaleString()} &mdash;{" "}
                      {new Date(req.proposedPickupEnd).toLocaleString()}
                    </p>
                    {req.notes ? <p className="mt-1 italic text-slate-600">&ldquo;{req.notes}&rdquo;</p> : null}
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Ready Items ({itemCount}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {req.items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800"
                        >
                          <span className="font-bold">{item.batch.batchCode}</span>
                          {item.batch.container ? (
                            <span className="text-slate-500">({item.batch.container.containerCode})</span>
                          ) : null}
                          <span>&bull; {formatKg(item.batch.grossWeightKg ?? item.batch.declaredMassKg)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {isRejecting ? (
                    <div className="mt-4 rounded-md bg-red-50/70 p-3 border border-red-200">
                      <p className="text-xs font-bold text-red-800 mb-2">Provide Reason for Rejection:</p>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Vehicle breakdown; please reschedule for tomorrow."
                        className="w-full rounded border border-red-300 p-2 text-sm text-slate-900 bg-white"
                      />
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setRejectingId(null)}
                          className="text-xs py-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleRespond(req.id, "REJECT")}
                          disabled={isPending}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs py-1"
                        >
                          Confirm Rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setRejectingId(req.id);
                          setRejectionReason("");
                        }}
                        disabled={isPending}
                        className="text-xs"
                      >
                        Reject Request
                      </Button>
                      <Button
                        onClick={() => handleRespond(req.id, "ACCEPT")}
                        disabled={isPending}
                        className="bg-[#00C972] text-black hover:bg-[#00C972]/90 text-xs font-bold"
                      >
                        Accept Pickup Request
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 2. Accepted & Active Logistics Section */}
      <Card>
        <h2 className="text-lg font-bold text-black mb-1">Accepted & Scheduled Pickups</h2>
        <p className="text-sm text-slate-500 mb-4">
          Assign operator vehicle and monitor transport logistics from collection to facility delivery.
        </p>

        {acceptedRequests.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No active or scheduled pickup routes currently in progress.
          </div>
        ) : (
          <div className="grid gap-4">
            {acceptedRequests.map((req) => (
              <div key={req.id} className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{req.requestCode}</span>
                      <Badge tone={req.status === "ACCEPTED" ? "amber" : req.status === "SCHEDULED" ? "green" : "blue"}>
                        {humanise(req.status)}
                      </Badge>
                    </div>
                    <p className="font-bold text-black text-base">{req.schoolOrganisation.name}</p>
                    <p className="text-xs text-slate-500">{req.items.length} container load(s)</p>
                  </div>

                  <div>
                    {req.status === "ACCEPTED" ? (
                      <form
                        action={async (formData) => {
                          await schedulePickupLogisticsFormAction(formData);
                        }}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input type="hidden" name="requestId" value={req.id} />
                        <SelectField
                          label="Vehicle"
                          name="vehicleId"
                          options={vehicles.map((v) => ({ value: v.id, label: `${v.label} (${v.plate})` }))}
                        />
                        <Field
                          label="Scheduled time"
                          name="actualScheduledAt"
                          type="datetime-local"
                          required
                          defaultValue={new Date(req.proposedPickupStart).toISOString().slice(0, 16)}
                        />
                        <TextareaField
                          label="Route notes"
                          name="routeNotes"
                          required
                          defaultValue="Standard morning collection route."
                        />
                        <Button type="submit" className="text-xs">
                          Confirm Logistics Schedule
                        </Button>
                      </form>
                    ) : req.status === "SCHEDULED" ? (
                      <form action={confirmRequestDeliveryAction.bind(null, req.id, "IN_TRANSIT")}>
                        <Button variant="secondary" className="text-xs">
                          Mark Vehicle In Transit
                        </Button>
                      </form>
                    ) : req.status === "IN_TRANSIT" ? (
                      <form action={confirmRequestDeliveryAction.bind(null, req.id, "DELIVERED")}>
                        <Button className="text-xs bg-[#00C972] text-black">
                          Confirm Delivery to Facility
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
