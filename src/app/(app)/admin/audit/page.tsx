import { Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function AuditPage() {
  await requireUser("view_audit");
  const logs = await prisma.auditLog.findMany({ include: { actor: true, organisation: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="grid gap-6">
      <PageHeader title="Audit Logs" description="Critical activity is append-only through the application. No UI path edits or deletes audit entries." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Time</th><th>Actor</th><th>Organisation</th><th>Action</th><th>Entity</th><th>Reason</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3">{log.createdAt.toISOString()}</td>
                  <td>{log.actor?.name ?? "System"}</td>
                  <td>{log.organisation?.name ?? "Global"}</td>
                  <td className="font-semibold">{log.action}</td>
                  <td>{log.entityType}</td>
                  <td>{log.reason ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
