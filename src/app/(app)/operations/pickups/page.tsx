import { confirmDeliveryAction, schedulePickupFormAction } from "@/app/actions";
import { Button, Card, Field, PageHeader, SelectField, TextareaField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatKg, humanise } from "@/lib/utils";

export default async function PickupsPage() {
  await requireUser("schedule_pickup");
  const [batches, vehicles, pickups] = await Promise.all([
    prisma.wasteBatch.findMany({
      where: { status: { in: ["READY_FOR_PICKUP", "PICKUP_SCHEDULED", "IN_TRANSIT"] } },
      include: { sourceOrganisation: true },
      orderBy: { collectionTimestamp: "asc" },
    }),
    prisma.vehicle.findMany(),
    prisma.pickup.findMany({ include: { batch: { include: { sourceOrganisation: true } }, vehicle: true }, orderBy: { scheduledAt: "asc" } }),
  ]);
  const schedulable = batches.filter((batch) => batch.status === "READY_FOR_PICKUP");
  return (
    <div className="grid gap-6">
      <PageHeader title="Pickup Schedule" description="Rule-based scheduling uses volume and storage warnings. No AI route optimisation is claimed." />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-lg font-bold">Schedule pickup</h2>
          <form action={schedulePickupFormAction} className="mt-4 grid gap-4">
            <SelectField label="Batch" name="batchId" required options={schedulable.map((batch) => ({ value: batch.id, label: `${batch.batchCode} - ${batch.sourceOrganisation.name} - ${formatKg(batch.grossWeightKg)}` }))} />
            <SelectField label="Vehicle" name="vehicleId" options={vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.label} (${vehicle.plate})` }))} />
            <Field label="Scheduled at" name="scheduledAt" type="datetime-local" required />
            <Field label="Distance (km)" name="distanceKm" type="number" step="0.1" min="0" required />
            <TextareaField label="Route notes" name="routeNotes" required defaultValue="Rule-based route after combined pickup threshold." />
            <Button>Schedule pickup</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Active route work</h2>
          <div className="mt-4 grid gap-3">
            {pickups.map((pickup) => (
              <div key={pickup.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--orbit-primary)]">{pickup.batch.batchCode}</p>
                    <p className="text-sm text-slate-500">{pickup.batch.sourceOrganisation.name} - {humanise(pickup.status)}</p>
                  </div>
                  {(pickup.batch.status === "PICKUP_SCHEDULED" || pickup.batch.status === "IN_TRANSIT") ? (
                    <form action={confirmDeliveryAction.bind(null, pickup.batchId)}>
                      <Button variant="secondary">{pickup.batch.status === "PICKUP_SCHEDULED" ? "Mark in transit" : "Confirm delivery"}</Button>
                    </form>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{pickup.routeNotes}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
