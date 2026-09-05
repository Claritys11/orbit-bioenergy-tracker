import { createFulfilmentFormAction } from "@/app/actions";
import { Badge, Button, Card, Field, MobileCard, PageHeader, SelectField, StatusBadge, TextareaField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { can } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { requireUser } from "@/lib/services/authz";
import { formatGas } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Factory, Flame, Gauge, GraduationCap, PackageCheck, Recycle, Users, Zap } from "lucide-react";

function formatPoolName(pool: string) {
  const p = pool.toLowerCase();
  if (p === "operator" || p === "facility") return "Community Facility / O&M Pool (30%)";
  if (p === "schools" || p === "school") return "School Energy Pool (50%)";
  if (p === "contributors" || p === "contributor") return "Supporting Contributor Pool (20%)";
  return pool;
}

export default async function FulfilmentPage() {
  const user = await requireUser("view_reports");
  const role = user.role as Role;
  const canFulfil = can(role, "fulfil_allocation");

  const [allocations, orgs] = await Promise.all([
    prisma.energyAllocation.findMany({
      include: { cycle: true, fulfilments: true },
      orderBy: { finalisedAt: "desc" },
    }),
    prisma.organisation.findMany(),
  ]);

  const orgMap = new Map(orgs.map((o) => [o.id, o.name]));

  const totalAllocated = allocations.reduce((sum, item) => sum + item.allocatedGasM3, 0);
  const totalFulfilled = allocations.reduce(
    (sum, item) => sum + item.fulfilments.reduce((inner, f) => inner + f.volumeM3, 0),
    0,
  );
  const totalRemaining = Math.max(0, totalAllocated - totalFulfilled);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Energy Allocation & Fulfilment"
        description="Physical energy delivery managed by Community Facility operators. Transparently track piped biogas, low-pressure bag deliveries, and on-hub energy usage without overstating claims."
      />

      {/* Visual Product Story Traceability Chain */}
      <Card className="p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-emerald-50/70 border-slate-200">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          The Complete Traceable Bioenergy Flow
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 shadow-xs border border-slate-200 text-slate-900">
            <Recycle size={14} className="text-blue-600" /> 1. Source Waste
          </span>
          <ArrowRight size={14} className="text-slate-400" />
          <span className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 shadow-xs border border-slate-200 text-slate-900">
            <CheckCircle2 size={14} className="text-emerald-600" /> 2. Accepted Organics
          </span>
          <ArrowRight size={14} className="text-slate-400" />
          <span className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 shadow-xs border border-slate-200 text-slate-900">
            <Factory size={14} className="text-indigo-600" /> 3. Anaerobic Conversion
          </span>
          <ArrowRight size={14} className="text-slate-400" />
          <span className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 shadow-xs border border-slate-200 text-slate-900">
            <Gauge size={14} className="text-cyan-600" /> 4. Verified Biogas
          </span>
          <ArrowRight size={14} className="text-slate-400" />
          <span className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 shadow-xs border border-slate-200 text-slate-900">
            <Zap size={14} className="text-amber-600" /> 5. Allocation Engine
          </span>
          <ArrowRight size={14} className="text-slate-400" />
          <span className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white shadow-xs font-bold">
            <Flame size={14} /> 6. Physical Fulfilment
          </span>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Allocated Biogas</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatGas(totalAllocated)}</p>
          <p className="mt-1 text-xs text-slate-500">From verified physical meter cycles</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Delivered / Fulfilled</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{formatGas(totalFulfilled)}</p>
          <p className="mt-1 text-xs text-slate-500">Physically piped or transferred in gas bags</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining Balance to Fulfil</p>
          <p className="mt-2 text-2xl font-black text-amber-700">{formatGas(totalRemaining)}</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting dispatch or scheduled pickup</p>
        </Card>
      </div>

      <div className={`grid gap-6 ${canFulfil ? "xl:grid-cols-[1.1fr_0.9fr]" : "grid-cols-1"}`}>
        {/* Record Fulfilment Form (Facility Only) */}
        {canFulfil ? (
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Record Physical Energy Delivery</h2>
                <p className="text-xs text-slate-500">Record gas volume handed over to beneficiary schools or community kitchens</p>
              </div>
              <Badge tone="green">Community Facility</Badge>
            </div>

            <form action={createFulfilmentFormAction} className="mt-4 grid gap-4">
              <SelectField
                label="Target Allocation Credit *"
                name="allocationId"
                required
                options={allocations.map((a) => {
                  const fulfilled = a.fulfilments.reduce((s, f) => s + f.volumeM3, 0);
                  const remaining = Math.max(0, a.allocatedGasM3 - fulfilled);
                  return {
                    value: a.id,
                    label: `${a.cycle.cycleCode} — ${formatPoolName(a.pool)} [Remaining: ${formatGas(remaining)}]`,
                  };
                })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Delivered Volume (m³) *"
                  name="volumeM3"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 2.50"
                />
                <Field
                  label="Recipient Organisation or Contact *"
                  name="recipientName"
                  required
                  placeholder="e.g. SMK 99 Malang Canteen Kitchen"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Fulfilment Status *"
                  name="status"
                  required
                  options={[
                    { value: "DELIVERED_PHYSICALLY", label: "Delivered Physically (Handed over)" },
                    { value: "CONSUMED_AT_HUB", label: "Consumed at Community Hub (Facility use)" },
                    { value: "PARTIALLY_FULFILLED", label: "Partially Fulfilled" },
                    { value: "SCHEDULED", label: "Scheduled for Pickup" },
                    { value: "PENDING", label: "Pending Verification" },
                  ]}
                />
                <SelectField
                  label="Delivery Mode *"
                  name="deliveryMode"
                  required
                  options={[
                    { value: "LOW_PRESSURE_GAS_BAG", label: "Validated Low-Pressure Gas Bag" },
                    { value: "PIPED_BIOGAS", label: "Direct Piped Biogas Line" },
                    { value: "ON_HUB_COMMUNITY_USAGE", label: "On-Hub Community Kitchen Usage" },
                  ]}
                />
              </div>

              <TextareaField
                label="Delivery Verification Notes"
                name="notes"
                required
                defaultValue="Delivered to school canteen coordinator in verified low-pressure safety container."
              />

              <Button className="min-h-11 font-bold text-xs">
                <PackageCheck size={16} /> Save & Record Energy Fulfilment
              </Button>
            </form>
          </Card>
        ) : null}

        {/* Traceable Allocation Status Ledger */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fulfilment Ledger</h2>
              <p className="text-xs text-slate-500">Traceable delivery record by pool and cycle</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {allocations.map((a) => {
              const fulfilled = a.fulfilments.reduce((sum, item) => sum + item.volumeM3, 0);
              const remaining = Math.max(0, a.allocatedGasM3 - fulfilled);
              const progress = a.allocatedGasM3 > 0 ? Math.min(100, Math.round((fulfilled / a.allocatedGasM3) * 100)) : 0;
              const recipientName = orgMap.get(a.recipientOrgId);

              return (
                <MobileCard key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{a.cycle.cycleCode}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="mt-1 font-bold text-slate-900 text-sm">{formatPoolName(a.pool)}</p>
                      {recipientName ? (
                        <p className="text-xs text-slate-500">Recipient: {recipientName}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-800">
                        {progress}% fulfilled
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#00C972] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-slate-600">
                    <span>Fulfilled: <strong className="text-slate-900">{formatGas(fulfilled)}</strong></span>
                    <span>Allocated: <strong>{formatGas(a.allocatedGasM3)}</strong></span>
                    <span>Remaining: <strong className="text-amber-700">{formatGas(remaining)}</strong></span>
                  </div>

                  {a.fulfilments.length > 0 ? (
                    <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500 space-y-1">
                      {a.fulfilments.map((f) => (
                        <div key={f.id} className="flex justify-between">
                          <span>{f.recipientName} ({f.deliveryMode?.replace(/_/g, " ").toLowerCase()})</span>
                          <span className="font-semibold text-slate-900">{formatGas(f.volumeM3)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </MobileCard>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
