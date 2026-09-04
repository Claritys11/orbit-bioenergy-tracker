import { finaliseAllocationAction } from "@/app/actions";
import { AllocationChart } from "@/components/allocation-chart";
import { Button, Card, PageHeader } from "@/components/ui";
import { calculateAllocations } from "@/lib/domain/allocation";
import type { AllocationPool } from "@/lib/domain/types";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";

export default async function ConversionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("record_conversion");
  const { id } = await params;
  const [cycle, config] = await Promise.all([
    prisma.conversionCycle.findUniqueOrThrow({
      where: { id },
      include: {
        facility: { include: { organisation: true } },
        batches: { include: { batch: { include: { sourceOrganisation: true, category: true, inspection: true } } } },
        scores: true,
        allocations: true,
      },
    }),
    prisma.allocationConfiguration.findFirstOrThrow({ where: { active: true } }),
  ]);
  const simulation = calculateAllocations({
    verifiedGasM3: cycle.verifiedGasM3,
    operationalUseM3: cycle.operationalUseM3,
    safetyReserveM3: cycle.safetyReserveM3,
    config: { schoolPercent: config.schoolPercent, operatorPercent: config.operatorPercent, contributorPercent: config.contributorPercent },
    contributions: cycle.scores.map((score) => ({
      batchId: score.batchId,
      organisationId: score.organisationId,
      pool: score.pool as AllocationPool,
      acceptedMassKg: score.acceptedMassKg,
      yieldFactor: score.yieldFactor,
      qualityFactor: score.qualityFactor,
      conditionFactor: score.conditionFactor,
      rejected: score.contributionScore === 0,
      contributionScore: score.contributionScore,
      estimatedGasM3: score.estimatedGasM3,
    })),
  });
  return (
    <div className="grid gap-6">
      <PageHeader title={cycle.cycleCode} description="Conversion detail with measured gas, estimated contribution scores, and allocation simulation before finalisation." />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Verified gas</p><p className="text-2xl font-bold">{formatGas(cycle.verifiedGasM3)}</p></Card>
        <Card><p className="text-sm text-slate-500">Operational use</p><p className="text-2xl font-bold">{formatGas(cycle.operationalUseM3)}</p></Card>
        <Card><p className="text-sm text-slate-500">Safety reserve</p><p className="text-2xl font-bold">{formatGas(cycle.safetyReserveM3)}</p></Card>
        <Card><p className="text-sm text-slate-500">Allocatable</p><p className="text-2xl font-bold">{formatGas(simulation.allocatableGasM3)}</p></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Contribution scores</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Batch</th><th>Accepted</th><th>Estimated gas</th><th>Score</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {cycle.batches.map(({ batch }) => {
                  const score = cycle.scores.find((item) => item.batchId === batch.id);
                  return (
                    <tr key={batch.id}>
                      <td className="py-3 font-semibold">{batch.batchCode}</td>
                      <td>{formatKg(batch.inspection?.acceptedMassKg ?? 0)}</td>
                      <td>{formatGas(score?.estimatedGasM3 ?? 0)}</td>
                      <td>{score?.contributionScore.toFixed(4) ?? "0"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Allocation simulation</h2>
          <AllocationChart data={Object.entries(simulation.pools).map(([name, value]) => ({ name, value }))} />
          <form action={finaliseAllocationAction.bind(null, cycle.id)}>
            <Button disabled={cycle.allocations.some((allocation) => allocation.status === "FINALISED")}>
              {cycle.allocations.some((allocation) => allocation.status === "FINALISED") ? "Allocation finalised" : "Finalise allocation"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
