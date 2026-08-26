import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";
import { Badge, Card, LinkButton, Metric, PageHeader } from "@/components/ui";

export default async function DashboardPage() {
  const user = await requireUser();
  const [batches, inspections, cycles, allocations, alerts] = await Promise.all([
    prisma.wasteBatch.findMany({
      where:
        user.role === "SUPER_ADMIN" || user.role === "OPERATOR"
          ? {}
          : { sourceOrganisationId: user.organisationId },
      include: { category: true, inspection: true, sourceOrganisation: true, pickup: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.contaminationInspection.findMany(),
    prisma.conversionCycle.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.energyAllocation.findMany({
      where:
        user.role === "SUPER_ADMIN" || user.role === "OPERATOR"
          ? {}
          : { recipientOrgId: user.organisationId },
      include: { fulfilments: true },
    }),
    prisma.safetyAlert.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const acceptedMass = inspections.reduce((sum, item) => sum + item.acceptedMassKg, 0);
  const verifiedGas = cycles.reduce((sum, item) => sum + item.verifiedGasM3, 0);
  const allocation = allocations.reduce((sum, item) => sum + item.allocatedGasM3, 0);
  const fulfilled = allocations.reduce(
    (sum, item) => sum + item.fulfilments.reduce((inner, fulfilment) => inner + fulfilment.volumeM3, 0),
    0,
  );
  const title =
    user.role === "OPERATOR"
      ? "Operator Dashboard"
      : user.role === "SUPER_ADMIN"
        ? "Super Admin Dashboard"
        : "School Dashboard";

  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description="Operational indicators only: traceability, contamination, verified gas, allocation, fulfilment, and unresolved safety work."
        action={<LinkButton href="/batches/new" variant="secondary">Register waste</LinkButton>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Accepted organic waste" value={formatKg(acceptedMass)} hint="Measured by operator inspections." />
        <Metric label="Verified biogas generated" value={formatGas(verifiedGas)} hint="Metered or manually verified cycle records." />
        <Metric label="Allocated biogas" value={formatGas(allocation)} hint="Finalised allocation versions only." />
        <Metric label="Fulfilled biogas" value={formatGas(fulfilled)} hint="Unfulfilled allocation is not counted as delivered energy." />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Recent batches</h2>
            <LinkButton href="/batches" variant="ghost">View all</LinkButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Batch</th>
                  <th>Source</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Mass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="py-3 font-semibold text-teal-800">{batch.batchCode}</td>
                    <td>{batch.sourceOrganisation.name}</td>
                    <td>{batch.category.name}</td>
                    <td><Badge tone={batch.status === "REJECTED" ? "red" : batch.status === "CONDITIONAL" ? "amber" : "green"}>{batch.status}</Badge></td>
                    <td>{formatKg(batch.grossWeightKg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-slate-950">Alerts and next actions</h2>
          <div className="mt-4 grid gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-md border border-slate-200 p-3">
                <Badge tone={alert.severity === "CRITICAL" ? "red" : alert.severity === "WARNING" ? "amber" : "green"}>{alert.severity}</Badge>
                <p className="mt-2 text-sm font-semibold">{alert.type}</p>
                <p className="text-sm leading-5 text-slate-600">{alert.message}</p>
              </div>
            ))}
            {alerts.length === 0 ? <p className="text-sm text-slate-500">No unresolved alerts.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
