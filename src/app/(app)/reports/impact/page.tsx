import { AllocationChart } from "@/components/allocation-chart";
import { Card, Metric, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { buildReportBrief } from "@/lib/report-brief";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";

export default async function ImpactPage() {
  await requireUser("view_reports");
  const [inspections, cycles, allocations] = await Promise.all([
    prisma.contaminationInspection.findMany(),
    prisma.conversionCycle.findMany(),
    prisma.energyAllocation.findMany({ include: { fulfilments: true } }),
  ]);
  const accepted = inspections.reduce((sum, item) => sum + item.acceptedMassKg, 0);
  const rejected = inspections.reduce((sum, item) => sum + item.rejectedMassKg, 0);
  const contamination = accepted + rejected > 0 ? (rejected / (accepted + rejected)) * 100 : 0;
  const verifiedGas = cycles.reduce((sum, item) => sum + item.verifiedGasM3, 0);
  const allocated = allocations.reduce((sum, item) => sum + item.allocatedGasM3, 0);
  const fulfilled = allocations.reduce(
    (sum, item) => sum + item.fulfilments.reduce((inner, fulfilment) => inner + fulfilment.volumeM3, 0),
    0,
  );
  const brief = buildReportBrief({
    acceptedWasteKg: accepted,
    rejectedWasteKg: rejected,
    verifiedGasM3: verifiedGas,
    allocatedGasM3: allocated,
    fulfilledGasM3: fulfilled,
  });
  return (
    <div className="grid gap-6">
      <PageHeader title="Impact Analytics" description="Measured, estimated, assumed, and pending values are separated to avoid overstating environmental or energy claims." />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Measured accepted waste" value={formatKg(accepted)} hint="Measured by operator inspection." />
        <Metric label="Measured contamination" value={`${contamination.toFixed(1)}%`} hint="Rejected mass over verified gross mass." />
        <Metric label="Verified biogas" value={formatGas(verifiedGas)} hint="Measured or manually verified cycle outputs." />
        <Metric label="Allocated biogas" value={formatGas(allocated)} hint="Finalised allocation records." />
      </div>
      <Card>
        <h2 className="text-lg font-bold">Allocation by pool</h2>
        <AllocationChart data={Object.entries(allocations.reduce<Record<string, number>>((acc, item) => {
          acc[item.pool] = (acc[item.pool] ?? 0) + item.allocatedGasM3;
          return acc;
        }, {})).map(([name, value]) => ({ name, value }))} />
      </Card>
      <Card>
        <h2 className="text-lg font-bold">{brief.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{brief.note}</p>
        <div className="mt-4 grid gap-3">
          {brief.highlights.map((highlight) => (
            <p key={highlight} className="rounded-md border border-[var(--orbit-border)] p-3 text-sm leading-6">
              {highlight}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
