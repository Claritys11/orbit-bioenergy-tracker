import { InspectionForm } from "@/components/inspection-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatKg } from "@/lib/utils";

export default async function InspectionsPage() {
  await requireUser("inspect_batch");
  const batches = await prisma.wasteBatch.findMany({
    where: { status: "DELIVERED" },
    include: { sourceOrganisation: true, container: true },
    orderBy: { updatedAt: "desc" },
  });

  const recent = await prisma.contaminationInspection.findMany({
    include: { batch: { include: { sourceOrganisation: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const formattedBatches = batches.map((b) => ({
    id: b.id,
    batchCode: b.batchCode,
    sourceOrganisationName: b.sourceOrganisation.name,
    containerCode: b.container?.containerCode,
    arrivedAt: b.updatedAt.toISOString(),
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Community Facility Inspection"
        description="Receive incoming organic waste, perform calibrated weighing, and remove contaminants. Accepted mass and contamination rates are calculated automatically."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Weigh & Inspect Load</h2>
            <Badge tone="green">Community Facility</Badge>
          </div>
          <InspectionForm batches={formattedBatches} />
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Verified Inspections</h2>
            <span className="text-xs text-slate-500">{recent.length} recent records</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Batch</th>
                  <th>Decision</th>
                  <th>Verified Gross</th>
                  <th>Accepted</th>
                  <th>Contamination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((inspection) => (
                  <tr key={inspection.id}>
                    <td className="py-3 font-semibold text-[var(--orbit-primary)]">
                      {inspection.batch.batchCode}
                    </td>
                    <td>
                      <Badge
                        tone={
                          inspection.decision === "REJECTED"
                            ? "red"
                            : inspection.decision === "CONDITIONAL"
                            ? "amber"
                            : "green"
                        }
                      >
                        {inspection.decision}
                      </Badge>
                    </td>
                    <td>{formatKg(inspection.verifiedGrossMassKg)}</td>
                    <td className="font-semibold text-slate-900">{formatKg(inspection.acceptedMassKg)}</td>
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
