import { InspectionForm } from "@/components/inspection-form";
import { ResponsiveTable } from "@/components/responsive-table";
import { Badge, Card, DataConfidenceBadge, PageHeader, StatusBadge } from "@/components/ui";
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
        description="Calibrated weighing and sorting: record physical scale measurements and remove contaminants. Accepted organic feedstock and contamination rates are calculated automatically."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Inspections" },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Weigh & Inspect Delivered Load</h2>
              <p className="text-xs text-slate-500">Facility calibrated scales & purity inspection</p>
            </div>
            <DataConfidenceBadge level="MEASURED" />
          </div>
          <InspectionForm batches={formattedBatches} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Recent Facility Inspections</h2>
              <p className="text-xs text-slate-500">{recent.length} verified physical scale records</p>
            </div>
            <Badge tone="green">Verified Scales</Badge>
          </div>

          <ResponsiveTable
            data={recent}
            columns={[
              {
                header: "Batch",
                cell: (item) => (
                  <span className="font-bold text-[var(--orbit-primary)]">{item.batch.batchCode}</span>
                ),
              },
              {
                header: "Decision",
                cell: (item) => <StatusBadge status={item.decision} />,
              },
              {
                header: "Gross Mass",
                cell: (item) => (
                  <span className="text-slate-700">{formatKg(item.verifiedGrossMassKg)}</span>
                ),
              },
              {
                header: "Accepted",
                cell: (item) => (
                  <span className="font-bold text-emerald-800">{formatKg(item.acceptedMassKg)}</span>
                ),
              },
              {
                header: "Contamination",
                cell: (item) => (
                  <span className="text-slate-600">{item.contaminationRate}%</span>
                ),
              },
            ]}
            mobileCard={(item) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--orbit-primary)]">{item.batch.batchCode}</span>
                  <StatusBadge status={item.decision} />
                </div>
                <p className="text-xs text-slate-500">{item.batch.sourceOrganisation.name}</p>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gross</span>
                    <strong className="text-slate-700">{formatKg(item.verifiedGrossMassKg)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Accepted</span>
                    <strong className="text-emerald-800">{formatKg(item.acceptedMassKg)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Rejected</span>
                    <strong className="text-slate-600">{item.contaminationRate}%</strong>
                  </div>
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
