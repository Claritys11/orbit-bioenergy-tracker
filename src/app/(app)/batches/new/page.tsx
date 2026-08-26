import { createBatchFormAction } from "@/app/actions";
import { Button, Card, Field, PageHeader, SelectField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function NewBatchPage() {
  const user = await requireUser("create_batch");
  const [sources, categories] = await Promise.all([
    prisma.wasteSource.findMany({ where: { organisationId: user.organisationId } }),
    prisma.feedstockCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Create QR Waste Batch"
        description="Register source-separated organics. The server creates the batch code, secure QR identifier, pickup request, and audit entry."
      />
      <Card>
        <form action={createBatchFormAction} className="grid gap-4 md:grid-cols-2">
          <SelectField label="Waste source" name="sourceId" required options={sources.map((source) => ({ value: source.id, label: source.name }))} />
          <SelectField label="Feedstock category" name="categoryId" required options={categories.map((category) => ({ value: category.id, label: `${category.name} (${category.yieldFactor} demo yield)` }))} />
          <Field label="Gross weight (kg)" name="grossWeightKg" type="number" step="0.1" min="0" required />
          <Field label="Collection timestamp" name="collectionTimestamp" type="datetime-local" required />
          <Field label="Optional photo URL" name="photoUrl" type="url" />
          <Field label="Storage status" name="storageStatus" required defaultValue="Covered bin, labelled and separated" />
          <div className="md:col-span-2">
            <Button>Create batch and QR request</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
