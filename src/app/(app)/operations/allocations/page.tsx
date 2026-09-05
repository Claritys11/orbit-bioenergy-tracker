import { AllocationChart } from "@/components/allocation-chart";
import { Badge, Card, MobileCard, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas } from "@/lib/utils";
import { Award, Factory, GraduationCap, Users, Zap } from "lucide-react";

function formatPoolName(pool: string) {
  const p = pool.toLowerCase();
  if (p === "operator" || p === "facility") return "Community Facility / O&M Pool (30%)";
  if (p === "schools" || p === "school") return "School Energy Pool (50%)";
  if (p === "contributors" || p === "contributor") return "Supporting Contributor Pool (20%)";
  return pool;
}

export default async function AllocationsPage() {
  await requireUser("view_reports");
  const [allocations, orgs] = await Promise.all([
    prisma.energyAllocation.findMany({
      include: { cycle: true, fulfilments: true },
      orderBy: { finalisedAt: "desc" },
    }),
    prisma.organisation.findMany(),
  ]);

  const orgMap = new Map(orgs.map((o) => [o.id, o.name]));

  const chart = allocations.reduce<Record<string, number>>((acc, allocation) => {
    const formatted = formatPoolName(allocation.pool);
    acc[formatted] = (acc[formatted] ?? 0) + allocation.allocatedGasM3;
    return acc;
  }, {});

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedGasM3, 0);
  const totalFulfilled = allocations.reduce(
    (sum, a) => sum + a.fulfilments.reduce((fSum, f) => fSum + f.volumeM3, 0),
    0,
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Energy Allocation"
        description="Automated, idempotent bioenergy credit allocation calculated from verified physical gas output. The 50/30/20 rule credits participating schools, community facility operations, and feedstock contributors."
      />

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-blue-600">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <GraduationCap size={16} /> School Energy Pool
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">50%</p>
          <p className="mt-1 text-xs text-slate-500">Credited to source schools for canteen cooking fuel</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Factory size={16} /> Community Facility / O&M Pool
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">30%</p>
          <p className="mt-1 text-xs text-slate-500">Dedicated to TPS3R operational energy & facility maintenance</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Users size={16} /> Supporting Contributor Pool
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">20%</p>
          <p className="mt-1 text-xs text-slate-500">Reserved for market vendors and neighborhood waste partners</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900">Pool Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Total verified allocated volume by beneficiary pool</p>
          <AllocationChart data={Object.entries(chart).map(([name, value]) => ({ name, value }))} />
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Allocated:</span>
              <span className="font-bold text-slate-900">{formatGas(totalAllocated)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Fulfilled:</span>
              <span className="font-bold text-emerald-700">{formatGas(totalFulfilled)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Allocation Records</h2>
              <p className="text-xs text-slate-500">Idempotent allocation ledger generated from verified cycles</p>
            </div>
            <Badge tone="green">{allocations.length} Records</Badge>
          </div>

          {/* Desktop Table View */}
          <div className="mt-4 hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-100 pb-2">
                <tr>
                  <th className="py-2">Cycle</th>
                  <th>Beneficiary Pool</th>
                  <th>Status</th>
                  <th>Allocated Gas</th>
                  <th>Fulfilled Gas</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((allocation) => {
                  const fulfilled = allocation.fulfilments.reduce((sum, item) => sum + item.volumeM3, 0);
                  const remaining = Math.max(0, allocation.allocatedGasM3 - fulfilled);
                  const recipientName = orgMap.get(allocation.recipientOrgId);
                  return (
                    <tr key={allocation.id} className="hover:bg-slate-50">
                      <td className="py-3 font-semibold text-[var(--orbit-primary)]">
                        {allocation.cycle.cycleCode}
                      </td>
                      <td>
                        <p className="font-medium text-slate-900">{formatPoolName(allocation.pool)}</p>
                        {recipientName ? (
                          <p className="text-xs text-slate-500">{recipientName}</p>
                        ) : null}
                      </td>
                      <td>
                        <StatusBadge status={allocation.status} />
                      </td>
                      <td className="font-bold text-slate-900">{formatGas(allocation.allocatedGasM3)}</td>
                      <td className="font-medium text-emerald-700">{formatGas(fulfilled)}</td>
                      <td className="text-xs text-slate-500">{formatGas(remaining)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="mt-4 grid gap-3 md:hidden">
            {allocations.map((allocation) => {
              const fulfilled = allocation.fulfilments.reduce((sum, item) => sum + item.volumeM3, 0);
              const remaining = Math.max(0, allocation.allocatedGasM3 - fulfilled);
              const recipientName = orgMap.get(allocation.recipientOrgId);
              return (
                <MobileCard key={allocation.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--orbit-primary)]">
                      {allocation.cycle.cycleCode}
                    </span>
                    <StatusBadge status={allocation.status} />
                  </div>
                  <p className="mt-1 font-bold text-slate-900 text-sm">{formatPoolName(allocation.pool)}</p>
                  {recipientName ? (
                    <p className="text-xs text-slate-500">{recipientName}</p>
                  ) : null}

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="text-slate-400">Allocated:</span>
                      <p className="font-bold text-slate-900">{formatGas(allocation.allocatedGasM3)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Fulfilled:</span>
                      <p className="font-bold text-emerald-700">{formatGas(fulfilled)}</p>
                    </div>
                  </div>
                </MobileCard>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
