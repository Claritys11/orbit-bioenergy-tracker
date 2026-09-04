import { AllocationChart } from "@/components/allocation-chart";
import { ResponsiveTable } from "@/components/responsive-table";
import { Card, DataConfidenceBadge, PageHeader, StatusBadge } from "@/components/ui";
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
        title="Energy Allocation Ledger"
        description="Audited 50/30/20 credit distributions calculated from verified allocatable biogas. Corrections require an immutable audit trail."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Energy Allocations" },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-950">Pool Distribution</h2>
            <DataConfidenceBadge level="VERIFIED_BIOGAS" />
          </div>
          <AllocationChart data={Object.entries(chart).map(([name, value]) => ({ name, value }))} />
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-950">Allocation Versions</h2>
            <span className="text-xs text-slate-500">{allocations.length} records</span>
          </div>

          <ResponsiveTable
            data={allocations}
            columns={[
              {
                header: "Cycle",
                cell: (item) => (
                  <span className="font-bold text-[var(--orbit-primary)]">{item.cycle.cycleCode}</span>
                ),
              },
              {
                header: "Pool",
                accessorKey: "pool",
              },
              {
                header: "Version",
                cell: (item) => <span className="font-mono text-xs">v{item.version}</span>,
              },
              {
                header: "Status",
                cell: (item) => <StatusBadge status={item.status} />,
              },
              {
                header: "Allocated",
                cell: (item) => (
                  <span className="font-bold text-slate-900">{formatGas(item.allocatedGasM3)}</span>
                ),
              },
              {
                header: "Fulfilled",
                cell: (item) => {
                  const fulfilled = item.fulfilments.reduce((sum, f) => sum + f.volumeM3, 0);
                  return <span className="font-semibold text-emerald-800">{formatGas(fulfilled)}</span>;
                },
              },
            ]}
            mobileCard={(item) => {
              const fulfilled = item.fulfilments.reduce((sum, f) => sum + f.volumeM3, 0);
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--orbit-primary)]">{item.cycle.cycleCode}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.pool} Pool</span>
                    <span className="font-mono text-slate-400">v{item.version}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <div>
                      <span className="text-slate-500">Allocated: </span>
                      <strong>{formatGas(item.allocatedGasM3)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Fulfilled: </span>
                      <strong className="text-emerald-800">{formatGas(fulfilled)}</strong>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </Card>
      </div>
    </div>
  );
}
