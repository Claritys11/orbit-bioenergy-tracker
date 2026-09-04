import { createBatchFormAction } from "@/app/actions";
import { Button, Card, Field, PageHeader, SelectField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function NewBatchPage() {
  const user = await requireUser("create_waste_record");
  const [containers, sources, categories] = await Promise.all([
    user.organisationId
      ? prisma.wasteContainer.findMany({
          where: { organisationId: user.organisationId, isActive: true },
          include: { source: true, category: true },
          orderBy: { containerCode: "asc" },
        })
      : [],
    user.organisationId
      ? prisma.wasteSource.findMany({ where: { organisationId: user.organisationId } })
      : prisma.wasteSource.findMany(),
    prisma.feedstockCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Register Waste"
        description="Mark assigned reusable container as ready for school pickup. Official weighing and contamination inspection will be performed upon delivery at the Community Facility."
      />
      <Card>
        <form action={createBatchFormAction} className="grid gap-4 md:grid-cols-2">
          {containers.length > 0 ? (
            <div className="md:col-span-2">
              <SelectField
                label="Assigned Reusable Container (Recommended)"
                name="containerId"
                options={[
                  { value: "", label: "-- Select assigned container --" },
                  ...containers.map((c) => ({
                    value: c.id,
                    label: `${c.containerCode} — ${c.source.name} (${c.category.name}) [Status: ${c.status.replace(/_/g, " ")}]`,
                  })),
                ]}
              />
              <p className="mt-1 text-xs text-slate-500">
                Selecting a container automatically inherits its registered waste source and feedstock category.
              </p>
            </div>
          ) : null}

          <SelectField
            label="Waste source"
            name="sourceId"
            options={sources.map((source) => ({ value: source.id, label: source.name }))}
          />

          <Field
            label="Estimated mass (kg) — Optional"
            name="declaredMassKg"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 15.0 (Unverified estimate)"
          />
          <Field
            label="Collection / Ready timestamp"
            name="collectionTimestamp"
            type="datetime-local"
            required
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
          <Field label="Optional photo URL" name="photoUrl" type="url" placeholder="https://..." />
          <Field
            label="Storage condition"
            name="storageStatus"
            required
            defaultValue="Covered bin, labelled and separated"
          />

          <div className="md:col-span-2 mt-2 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Official gross mass, rejected contamination, and accepted organics will be measured at Community Facility.
            </p>
            <Button>Mark Container Ready</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

