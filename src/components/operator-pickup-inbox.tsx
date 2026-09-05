"use client";

import { useState } from "react";
import {
  confirmRequestDeliveryAction,
  respondPickupRequestFormAction,
  schedulePickupLogisticsFormAction,
} from "@/app/actions";
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  MobileCard,
  SelectField,
  StatusBadge,
  TextareaField,
} from "@/components/ui";
import { formatKg, humanise } from "@/lib/utils";
import { CalendarCheck, CheckCircle2, Clock, MapPin, Truck, XCircle } from "lucide-react";

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
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<"NEW" | "SCHEDULED" | "TRANSIT" | "DELIVERED">("NEW");

  const pendingRequests = requests.filter((r) => r.status === "PENDING_OPERATOR_RESPONSE");
  const scheduledRequests = requests.filter((r) => r.status === "ACCEPTED" || r.status === "SCHEDULED");
  const transitRequests = requests.filter((r) => r.status === "IN_TRANSIT");
  const deliveredRequests = requests.filter((r) => r.status === "DELIVERED");

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
      {error ? (
        <AlertBanner tone="error" title="Action Failed">
          {error}
        </AlertBanner>
      ) : null}

      {/* Mobile-Friendly Quick Tab Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("NEW")}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === "NEW"
              ? "bg-[var(--orbit-primary)] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>Incoming Requests</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-black">
            {pendingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SCHEDULED")}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === "SCHEDULED"
              ? "bg-[var(--orbit-primary)] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>Scheduled / Dispatch</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-800">
            {scheduledRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TRANSIT")}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === "TRANSIT"
              ? "bg-[var(--orbit-primary)] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>In Transit</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-800">
            {transitRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DELIVERED")}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === "DELIVERED"
              ? "bg-[var(--orbit-primary)] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>Completed</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-800">
            {deliveredRequests.length}
          </span>
        </button>
      </div>

      {/* 1. NEW REQUESTS TAB */}
      {activeTab === "NEW" ? (
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">New School Collection Demands</h2>
              <p className="text-xs text-slate-500">Review proposed pickup windows and accept for vehicle dispatch</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              {pendingRequests.length} Awaiting Response
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <EmptyState
              title="No pending pickup requests"
              description="Schools have not submitted any new pickup requests. When containers are marked ready, they will appear here."
            />
          ) : (
            <div className="mt-4 grid gap-4">
              {pendingRequests.map((req) => {
                const totalMass = req.items.reduce((acc, i) => acc + (i.batch.grossWeightKg ?? i.batch.declaredMassKg ?? 0), 0);
                const isRejecting = rejectingId === req.id;

                return (
                  <MobileCard key={req.id} className="border-2 border-amber-200 bg-amber-50/20">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{req.requestCode}</span>
                          <StatusBadge status={req.status} />
                        </div>
                        <h3 className="mt-1 text-lg font-black text-slate-950">{req.schoolOrganisation.name}</h3>
                        <p className="text-xs text-slate-500">Requested by {req.requestedByUser.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-[var(--orbit-primary)]">
                          {totalMass > 0 ? `~${formatKg(totalMass)}` : "Awaiting weighing"}
                        </p>
                        <p className="text-xs font-semibold text-slate-600">{req.items.length} container load(s)</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-white p-3.5 border border-slate-200 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <Clock size={14} className="text-slate-400" />
                        Proposed Window:
                      </div>
                      <p className="mt-1 pl-5">
                        {new Date(req.proposedPickupStart).toLocaleString()} &mdash; {new Date(req.proposedPickupEnd).toLocaleTimeString()}
                      </p>
                      {req.notes ? (
                        <p className="mt-2 pl-5 italic text-slate-600 bg-slate-50 p-2 rounded">
                          &ldquo;{req.notes}&rdquo;
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Containers ({req.items.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {req.items.map((item) => (
                          <span key={item.id} className="rounded-md bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800">
                            {item.batch.container?.containerCode ?? item.batch.batchCode}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isRejecting ? (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-bold text-red-900 mb-2">Provide reason for rejection:</p>
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Truck breakdown, scheduling for next day"
                          className="w-full rounded-md border border-red-300 p-2 text-xs bg-white text-slate-900"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <Button variant="secondary" onClick={() => setRejectingId(null)} className="text-xs min-h-9">
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleRespond(req.id, "REJECT")}
                            disabled={isPending}
                            className="bg-red-700 hover:bg-red-800 text-white text-xs min-h-9 font-bold"
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
                          className="min-h-11 text-xs"
                        >
                          Reject Request
                        </Button>
                        <Button
                          onClick={() => handleRespond(req.id, "ACCEPT")}
                          disabled={isPending}
                          className="bg-[#00C972] text-black hover:bg-[#00C972]/90 min-h-11 text-xs font-black px-5"
                        >
                          <CheckCircle2 size={16} /> Accept Pickup Request
                        </Button>
                      </div>
                    )}
                  </MobileCard>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}

      {/* 2. SCHEDULED / DISPATCH TAB */}
      {activeTab === "SCHEDULED" ? (
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Accepted & Scheduled Routes</h2>
              <p className="text-xs text-slate-500">Assign vehicle, configure route notes, and dispatch vehicle</p>
            </div>
          </div>

          {scheduledRequests.length === 0 ? (
            <EmptyState
              title="No scheduled pickups"
              description="Accepted requests will appear here for vehicle assignment and route confirmation."
            />
          ) : (
            <div className="mt-4 grid gap-4">
              {scheduledRequests.map((req) => (
                <MobileCard key={req.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{req.requestCode}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <h3 className="mt-1 text-base font-bold text-slate-900">{req.schoolOrganisation.name}</h3>
                      <p className="text-xs text-slate-500">{req.items.length} container load(s)</p>
                    </div>

                    {req.status === "SCHEDULED" ? (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500">Assigned Vehicle:</p>
                        <p className="text-sm font-bold text-slate-900">{req.pickup?.vehicle?.label ?? "D 2046 ORB"}</p>
                      </div>
                    ) : null}
                  </div>

                  {req.status === "ACCEPTED" ? (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3">
                        Vehicle & Logistics Dispatch
                      </p>
                      <form
                        action={async (formData) => {
                          await schedulePickupLogisticsFormAction(formData);
                          setSchedulingId(null);
                        }}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        <input type="hidden" name="requestId" value={req.id} />
                        <SelectField
                          label="Vehicle *"
                          name="vehicleId"
                          required
                          options={vehicles.map((v) => ({ value: v.id, label: `${v.label} (${v.plate})` }))}
                        />
                        <Field
                          label="Actual Scheduled Time *"
                          name="actualScheduledAt"
                          type="datetime-local"
                          required
                          defaultValue={new Date(req.proposedPickupStart).toISOString().slice(0, 16)}
                        />
                        <div className="sm:col-span-2">
                          <TextareaField
                            label="Route Notes"
                            name="routeNotes"
                            required
                            defaultValue="Standard school morning collection route. Reusable containers will be delivered to TPS3R hub."
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                          <Button className="min-h-11 font-bold text-xs">
                            <Truck size={16} /> Confirm Schedule & Assign Vehicle
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : req.status === "SCHEDULED" ? (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">
                        Vehicle assigned. Ready to depart for {req.schoolOrganisation.name}.
                      </p>
                      <form action={confirmRequestDeliveryAction.bind(null, req.id, "IN_TRANSIT")}>
                        <Button className="min-h-11 font-bold text-xs bg-indigo-700 hover:bg-indigo-800 text-white">
                          <Truck size={16} /> Mark Vehicle In Transit
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </MobileCard>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* 3. IN TRANSIT TAB */}
      {activeTab === "TRANSIT" ? (
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Vehicles Currently In Transit</h2>
              <p className="text-xs text-slate-500">Upon arrival at the community processing hub, confirm delivery</p>
            </div>
          </div>

          {transitRequests.length === 0 ? (
            <EmptyState
              title="No vehicles currently in transit"
              description="When drivers depart school collection points, active loads will appear here."
            />
          ) : (
            <div className="mt-4 grid gap-4">
              {transitRequests.map((req) => (
                <MobileCard key={req.id} className="border-2 border-purple-200 bg-purple-50/20 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{req.requestCode}</span>
                        <Badge tone="purple">🚚 En Route to Hub</Badge>
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-slate-950">{req.schoolOrganisation.name}</h3>
                      <p className="text-xs text-slate-500">Vehicle: {req.pickup?.vehicle?.label ?? "Logistics Van"} ({req.pickup?.vehicle?.plate ?? "D 2046 ORB"})</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-purple-900">{req.items.length} container load(s)</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-purple-100 pt-3">
                    <p className="text-xs text-purple-950 font-medium">
                      Standing at community hub? Confirm waste container drop-off:
                    </p>
                    <form action={confirmRequestDeliveryAction.bind(null, req.id, "DELIVERED")}>
                      <Button className="min-h-11 font-black text-xs bg-[#00C972] text-black hover:bg-[#00C972]/90 shadow-md">
                        <CheckCircle2 size={16} /> Confirm Delivery to Facility
                      </Button>
                    </form>
                  </div>
                </MobileCard>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* 4. DELIVERED TAB */}
      {activeTab === "DELIVERED" ? (
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Recently Completed Deliveries</h2>
              <p className="text-xs text-slate-500">Successfully handed over to community TPS3R facilities</p>
            </div>
          </div>

          {deliveredRequests.length === 0 ? (
            <EmptyState title="No completed deliveries yet" description="Completed logistics drop-offs will be archived here." />
          ) : (
            <div className="mt-4 grid gap-3">
              {deliveredRequests.slice(0, 8).map((req) => (
                <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 bg-slate-50/50 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{req.requestCode}</span>
                      <StatusBadge status="DELIVERED" />
                    </div>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{req.schoolOrganisation.name}</p>
                    <p className="text-slate-500">{req.items.length} container(s) delivered</p>
                  </div>
                  <div className="text-right text-slate-500">
                    <p>Delivered</p>
                    <p className="font-mono">{new Date(req.requestedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
