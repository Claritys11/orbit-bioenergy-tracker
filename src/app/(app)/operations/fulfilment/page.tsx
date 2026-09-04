import { createFulfilmentFormAction } from "@/app/actions";
import { Button, Card, Field, PageHeader, SelectField, TextareaField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { can } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { requireUser } from "@/lib/services/authz";
import { formatGas } from "@/lib/utils";

export default async function FulfilmentPage() {
  const user = await requireUser("view_reports");
  const role = user.role as Role;
  const canFulfil = can(role, "fulfil_allocation");

  const allocations = await prisma.energyAllocation.findMany({
    include: { cycle: true, fulfilments: true },
    orderBy: { finalisedAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Energy Allocation Fulfilment"
        description="Delivery tracking: record physical biogas delivery to school kitchens and community hubs across piped, low-pressure gas bag, and on-hub delivery modes."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Energy Fulfilment" },
        ]}
      />
      <div className={`grid gap-6 ${canFulfil ? "xl:grid-cols-[0.9fr_1.1fr]" : "grid-cols-1"}`}>
        {canFulfil ? (
          <Card>
            <h2 className="text-lg font-bold">Record fulfilment</h2>
            <form action={createFulfilmentFormAction} className="mt-4 grid gap-4">
              <SelectField
                label="Allocation"
                name="allocationId"
                required
                options={allocations.map((allocation) => ({
                  value: allocation.id,
                  label: `${allocation.cycle.cycleCode} - ${allocation.pool} - ${formatGas(allocation.allocatedGasM3)}`,
                }))}
              />
              <SelectField
                label="Status"
                name="status"
                required
                options={[
                  "PENDING",
                  "SCHEDULED",
                  "DELIVERED_PHYSICALLY",
                  "CONSUMED_AT_HUB",
                  "PARTIALLY_FULFILLED",
                  "CANCELLED",
                  "ROLLED_OVER",
                ].map((value) => ({ value, label: value }))}
              />
              <Field label="Volume (m3)" name="volumeM3" type="number" step="0.01" min="0" required />
              <Field label="Recipient" name="recipientName" required />
              <SelectField
                label="Delivery mode"
                name="deliveryMode"
                required
                options={[
                  { value: "PIPED_BIOGAS", label: "Piped biogas" },
                  { value: "LOW_PRESSURE_GAS_BAG", label: "Validated low-pressure gas bag" },
                  { value: "ON_HUB_COMMUNITY_USAGE", label: "On-hub community usage" },
                ]}
              />
              <TextareaField label="Notes" name="notes" required defaultValue="Fulfilment evidence recorded for demo allocation." />
              <Button>Save fulfilment</Button>
            </form>
          </Card>
        ) : null}
        <Card>
          <h2 className="text-lg font-bold">Allocation status</h2>
          <div className="mt-4 grid gap-3">
            {allocations.map((allocation) => {
              const fulfilled = allocation.fulfilments.reduce((sum, item) => sum + item.volumeM3, 0);
              return (
                <div key={allocation.id} className="rounded-md border border-slate-200 p-4">
                  <p className="font-semibold text-[var(--orbit-primary)]">
                    {allocation.cycle.cycleCode} - {allocation.pool}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatGas(fulfilled)} fulfilled of {formatGas(allocation.allocatedGasM3)}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
