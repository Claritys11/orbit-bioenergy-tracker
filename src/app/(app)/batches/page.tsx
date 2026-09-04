import Link from "next/link";
import { ResponsiveTable } from "@/components/responsive-table";
import { Card, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { can } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { requireUser } from "@/lib/services/authz";
import { formatKg } from "@/lib/utils";

export default async function BatchesPage() {
  const user = await requireUser("view_batches");
  const role = user.role as Role;

  const canCreateWasteRecord = can(role, "create_waste_record") || can(role, "create_batch");

  const batches = await prisma.wasteBatch.findMany({
    where:
      role === "SUPER_ADMIN" || role === "OPERATOR" || role === "COMMUNITY_PARTNER"
        ? {}
        : user.organisationId
        ? { sourceOrganisationId: user.organisationId }
        : {},
    include: { category: true, sourceOrganisation: true, inspection: true, container: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Organic Waste Batch Register"
        description="Audit every organic-waste load from canteen container declaration through logistics dispatch, facility weighing, and anaerobic conversion."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Waste Batches" },
        ]}
        action={
          canCreateWasteRecord ? (
            <LinkButton href="/batches/new" className="font-bold shadow-xs">
              Register Container
            </LinkButton>
          ) : undefined
        }
      />
      <Card>
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-950">Logged Batches</h2>
            <p className="text-xs text-slate-500">{batches.length} total supply chain records</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Live Ledger</span>
        </div>

        <ResponsiveTable
          data={batches}
          columns={[
            {
              header: "Batch Code",
              cell: (batch) => (
                <div>
                  <Link
                    className="font-bold text-[var(--orbit-primary)] hover:underline block"
                    href={`/batches/${batch.id}`}
                  >
                    {batch.batchCode}
                  </Link>
                  {batch.container ? (
                    <span className="font-mono text-[11px] text-slate-400">
                      {batch.container.containerCode}
                    </span>
                  ) : null}
                </div>
              ),
            },
            {
              header: "Source",
              cell: (batch) => <span className="text-slate-800">{batch.sourceOrganisation.name}</span>,
            },
            {
              header: "Category",
              cell: (batch) => <span className="text-slate-600">{batch.category.name}</span>,
            },
            {
              header: "Status",
              cell: (batch) => <StatusBadge status={batch.status} />,
            },
            {
              header: "Gross Mass",
              cell: (batch) => (
                <div>
                  <span className="font-medium text-slate-700">{formatKg(batch.grossWeightKg)}</span>
                  {batch.grossWeightKg ? null : (
                    <span className="text-[10px] text-slate-400 block">Facility pending</span>
                  )}
                </div>
              ),
            },
            {
              header: "Accepted",
              cell: (batch) =>
                batch.inspection ? (
                  <span className="font-bold text-emerald-800">
                    {formatKg(batch.inspection.acceptedMassKg)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Pending weighing</span>
                ),
            },
          ]}
          mobileCard={(batch) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/batches/${batch.id}`}
                    className="font-bold text-[var(--orbit-primary)] hover:underline text-sm"
                  >
                    {batch.batchCode}
                  </Link>
                  {batch.container ? (
                    <span className="ml-1.5 font-mono text-[10px] text-slate-500">
                      ({batch.container.containerCode})
                    </span>
                  ) : null}
                </div>
                <StatusBadge status={batch.status} />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{batch.sourceOrganisation.name}</span>
                <span className="text-slate-400">{batch.category.name}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Gross Mass</span>
                  <span className="font-semibold text-slate-800">{formatKg(batch.grossWeightKg)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Facility Accepted</span>
                  <span className="font-bold text-emerald-800">
                    {batch.inspection ? formatKg(batch.inspection.acceptedMassKg) : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
