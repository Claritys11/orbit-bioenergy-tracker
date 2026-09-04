import { Card, PageHeader } from "@/components/ui";
import { ResponsiveTable, Column } from "@/components/responsive-table";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

interface AuditLogRow {
  id: string;
  time: string;
  actor: string;
  organisation: string;
  action: string;
  entity: string;
  reason: string;
}

export default async function AuditPage() {
  await requireUser("view_audit");
  const logs = await prisma.auditLog.findMany({
    include: { actor: true, organisation: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const columns: Column<AuditLogRow>[] = [
    {
      header: "Timestamp",
      accessorKey: "time",
      cell: (row) => <span className="font-mono text-xs text-slate-500">{row.time}</span>,
    },
    {
      header: "Actor",
      accessorKey: "actor",
      cell: (row) => <span className="font-semibold text-slate-900">{row.actor}</span>,
    },
    {
      header: "Organisation",
      accessorKey: "organisation",
    },
    {
      header: "Action",
      accessorKey: "action",
      cell: (row) => <span className="font-mono font-bold text-emerald-700">{row.action}</span>,
    },
    {
      header: "Entity",
      accessorKey: "entity",
    },
    {
      header: "Reason / Note",
      accessorKey: "reason",
      cell: (row) => <span className="text-slate-500">{row.reason || "—"}</span>,
    },
  ];

  const data: AuditLogRow[] = logs.map((log) => ({
    id: log.id,
    time: log.createdAt.toISOString().replace("T", " ").slice(0, 19),
    actor: log.actor?.name ?? "System",
    organisation: log.organisation?.name ?? "Global",
    action: log.action,
    entity: log.entityType,
    reason: log.reason ?? "",
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Audit Logs"
        description="Critical activity is append-only through the application. No UI path edits or deletes audit entries."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "System Admin" },
          { label: "Audit Logs" },
        ]}
      />
      <ResponsiveTable
        columns={columns}
        data={data}
        emptyState={
          <Card className="p-8 text-center text-sm text-slate-500">
            No audit logs recorded yet.
          </Card>
        }
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-emerald-700">{row.action}</span>
              <span className="text-slate-400">{row.time}</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">{row.actor}</div>
            <div className="text-xs text-slate-500">
              Org: <span className="font-medium text-slate-700">{row.organisation}</span> • Entity:{" "}
              <span className="font-medium text-slate-700">{row.entity}</span>
            </div>
            {row.reason ? (
              <div className="rounded bg-slate-50 p-2 text-xs text-slate-600">
                {row.reason}
              </div>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
