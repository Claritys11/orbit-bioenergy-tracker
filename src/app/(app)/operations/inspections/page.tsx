import { inspectBatchFormAction } from "@/app/actions";
import { Button, Card, Field, PageHeader, SelectField, TextareaField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatKg } from "@/lib/utils";

export default async function InspectionsPage() {
  await requireUser("inspect_batch");
  const batches = await prisma.wasteBatch.findMany({
    where: { status: "DELIVERED" },
    include: { sourceOrganisation: true },
    orderBy: { updatedAt: "desc" },
  });
  const recent = await prisma.contaminationInspection.findMany({
    include: { batch: { include: { sourceOrganisation: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return (
    <div className="grid gap-6">
      <PageHeader title="Contamination Inspection" description="Operator-verified gross mass and rejected mass drive accepted mass, contamination rate, decision, and contribution score." />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-lg font-bold">Record inspection</h2>
          <form action={inspectBatchFormAction} className="mt-4 grid gap-4">
            <SelectField label="Delivered batch" name="batchId" required options={batches.map((batch) => ({ value: batch.id, label: `${batch.batchCode} - ${batch.sourceOrganisation.name}` }))} />
            <Field label="Verified gross mass (kg)" name="verifiedGrossMassKg" type="number" step="0.1" min="0" required />
            <Field label="Rejected mass (kg)" name="rejectedMassKg" type="number" step="0.1" min="0" required />
            <Field label="Contamination categories" name="contaminationCategories" required defaultValue="minor packaging" />
            <Field label="Condition factor" name="conditionFactor" type="number" step="0.01" min="0" required defaultValue="0.95" />
            <TextareaField label="Feedstock condition" name="feedstockCondition" required defaultValue="Fresh, source-separated, acceptable odour." />
            <TextareaField label="Operator notes" name="notes" required defaultValue="Inspection recorded by trained operator. Unsafe material receives zero contribution." />
            <Button>Save inspection</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Recent decisions</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr><th className="py-2">Batch</th><th>Decision</th><th>Accepted</th><th>Contamination</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((inspection) => (
                  <tr key={inspection.id}>
                    <td className="py-3 font-semibold text-teal-800">{inspection.batch.batchCode}</td>
                    <td>{inspection.decision}</td>
                    <td>{formatKg(inspection.acceptedMassKg)}</td>
                    <td>{inspection.contaminationRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
