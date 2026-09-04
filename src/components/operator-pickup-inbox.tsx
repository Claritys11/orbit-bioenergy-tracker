"use client";

import { useState } from "react";
import { AlertCircle, Clock, Truck } from "lucide-react";
import {
  confirmRequestDeliveryAction,
  respondPickupRequestFormAction,
  schedulePickupLogisticsFormAction,
} from "@/app/actions";
import { Badge, Button, Card, DataConfidenceBadge, Field, SelectField, StatusBadge, TextareaField } from "@/components/ui";

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
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === "PENDING_OPERATOR_RESPONSE");
  const acceptedRequests = requests.filter(
    (r) => r.status === "ACCEPTED" || r.status === "SCHEDULED" || r.status === "IN_TRANSIT",
  );

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
      {/* 1. Pending Incoming Requests */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-white font-bold">
                <Clock size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-950">
                Incoming School Pickup Requests
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review collection demand from schools. Accept to schedule vehicles or reject with reason.
            </p>
          </div>
          <Badge tone={pendingRequests.length > 0 ? "amber" : "slate"}>
            {pendingRequests.length} Pending
          </Badge>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No pending pickup requests awaiting response right now.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {pendingRequests.map((req) => {
              const itemCount = req.items.length;
              const isRejecting = rejectingId === req.id;

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-[var(--orbit-primary)]/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--orbit-primary)]">
                          {req.requestCode}
                        </span>
                        <Badge tone="amber">Awaiting Operator</Badge>
                      </div>
                      <h3 className="mt-1 text-base font-extrabold text-slate-950">
                        {req.schoolOrganisation.name}
                      </h3>
                      <p className="text-xs text-slate-500">Requested by {req.requestedByUser.name}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">
                        {itemCount} container load(s)
                      </span>
                      <div className="mt-0.5">
                        <DataConfidenceBadge level="UNVERIFIED" className="text-[10px]" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                    <p className="font-semibold text-slate-900">
                      Proposed Collection Window:
                    </p>
                    <p>
                      {new Date(req.proposedPickupStart).toLocaleDateString("id-ID", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      &mdash;{" "}
                      {new Date(req.proposedPickupEnd).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {req.notes ? (
                      <p className="italic text-slate-600 border-t border-slate-200/60 pt-1.5 mt-1.5">
                        &ldquo;{req.notes}&rdquo;
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Contained Drums ({itemCount}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {req.items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          <span className="font-bold">{item.batch.batchCode}</span>
                          {item.batch.container ? (
                            <span className="text-slate-500 font-mono text-[10px]">
                              ({item.batch.container.containerCode})
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isRejecting ? (
                    <div className="mt-4 rounded-xl bg-red-50/70 p-4 border border-red-200">
                      <p className="text-xs font-bold text-red-800 mb-2">Provide Reason for Rejection:</p>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. All fleet dispatched; please propose morning window."
                        className="w-full rounded-lg border border-red-300 p-2.5 text-xs text-slate-900 bg-white"
                      />
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setRejectingId(null)}
                          className="text-xs min-h-9"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleRespond(req.id, "REJECT")}
                          disabled={isPending}
                          className="bg-red-700 hover:bg-red-800 text-white text-xs min-h-9"
                        >
                          Confirm Rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setRejectingId(req.id);
                          setRejectionReason("");
                        }}
                        disabled={isPending}
                        className="text-xs min-h-9"
                      >
                        Reject Request
                      </Button>
                      <Button
                        onClick={() => handleRespond(req.id, "ACCEPT")}
                        disabled={isPending}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold min-h-9"
                      >
                        ✓ Accept Pickup Request
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 2. Accepted & Scheduled Logistics Section */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--orbit-primary)] text-white font-bold">
                <Truck size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-950">
                Logistics Dispatch & Route Management
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign vehicles, set dispatch timestamps, mark transit, and confirm facility deliveries.
            </p>
          </div>
          <Badge tone="blue">{acceptedRequests.length} Active</Badge>
        </div>

        {acceptedRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active or scheduled pickup routes currently in progress.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {acceptedRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-slate-200 p-5 bg-white shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {req.requestCode}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-950">
                      {req.schoolOrganisation.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {req.items.length} reusable container load(s)
                    </p>
                  </div>

                  {/* Status Progression Controls */}
                  <div className="flex items-center gap-2">
                    {req.status === "ACCEPTED" ? (
                      <Button
                        onClick={() => setSchedulingId(schedulingId === req.id ? null : req.id)}
                        className="text-xs bg-[var(--orbit-primary)] text-white"
                      >
                        {schedulingId === req.id ? "Close Form" : "Assign Vehicle & Schedule →"}
                      </Button>
                    ) : req.status === "SCHEDULED" ? (
                      <form action={confirmRequestDeliveryAction.bind(null, req.id, "IN_TRANSIT")}>
                        <Button className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold">
                          🚚 Mark Vehicle In Transit
                        </Button>
                      </form>
                    ) : req.status === "IN_TRANSIT" ? (
                      <form action={confirmRequestDeliveryAction.bind(null, req.id, "DELIVERED")}>
                        <Button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                          ✓ Confirm Delivery to Facility
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>

                {req.pickup?.vehicle ? (
                  <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Vehicle: <strong>{req.pickup.vehicle.label}</strong> ({req.pickup.vehicle.plate})
                    </span>
                    <span>
                      Scheduled Time:{" "}
                      <strong>
                        {new Date(req.pickup.scheduledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  </div>
                ) : null}

                {/* Collapsible Scheduling Form */}
                {schedulingId === req.id ? (
                  <form
                    action={async (formData) => {
                      await schedulePickupLogisticsFormAction(formData);
                      setSchedulingId(null);
                    }}
                    className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 mt-3 grid gap-3"
                  >
                    <input type="hidden" name="requestId" value={req.id} />
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--orbit-primary)]">
                      Assign Logistics Fleet
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SelectField
                        label="Assign Vehicle"
                        name="vehicleId"
                        options={vehicles.map((v) => ({
                          value: v.id,
                          label: `${v.label} (${v.plate})`,
                        }))}
                      />
                      <Field
                        label="Scheduled Time"
                        name="actualScheduledAt"
                        type="datetime-local"
                        required
                        defaultValue={new Date(req.proposedPickupStart).toISOString().slice(0, 16)}
                      />
                    </div>
                    <TextareaField
                      label="Route Notes"
                      name="routeNotes"
                      required
                      defaultValue="Standard morning collection route. Transport to Community Facility bay."
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setSchedulingId(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="text-xs bg-[var(--orbit-primary)] text-white font-bold">
                        Confirm Logistics Schedule
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
