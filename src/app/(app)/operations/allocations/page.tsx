import { AllocationChart } from "@/components/allocation-chart";
import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas } from "@/lib/utils";

export default async function AllocationsPage() {
  await requireUser("view_reports");
  const allocations = await prisma.energyAllocation.findMany({
    include: { cycle: true, fulfilments: true },
    orderBy: { finalisedAt: "desc" },
  });
  const chart = allocations.reduce<Record<string, number>>((acc, allocation) => {
    acc[allocation.pool] = (acc[allocation.pool] ?? 0) + allocation.allocatedGasM3;
    return acc;
  }, {});

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Energy Allocation"
        description="Finalised allocation versions calculated from verified allocatable gas. Corrections require a new version and audit entry."
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-lg font-bold">Pool distribution</h2>
          <AllocationChart data={Object.entries(chart).map(([name, value]) => ({ name, value }))} />
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Cycle</th>
                  <th>Pool</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Allocated</th>
                  <th>Fulfilled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td className="py-3 font-semibold text-[var(--orbit-primary)]">{allocation.cycle.cycleCode}</td>
                    <td>{allocation.pool}</td>
                    <td>{allocation.version}</td>
                    <td>
                      <Badge tone="green">{allocation.status}</Badge>
                    </td>
                    <td>{formatGas(allocation.allocatedGasM3)}</td>
                    <td>{formatGas(allocation.fulfilments.reduce((sum, item) => sum + item.volumeM3, 0))}</td>
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
