import { Badge, Card, PageHeader } from "@/components/ui";
import { permissionsByRole } from "@/lib/domain/rbac";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function SettingsPage() {
  await requireUser("manage_system");
  const config = await prisma.allocationConfiguration.findFirst({ where: { active: true } });
  return (
    <div className="grid gap-6">
      <PageHeader title="System Settings" description="Configuration changes are versioned and audited. Demo thresholds are labelled prototype assumptions." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Active allocation configuration</h2>
          {config ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Version</dt><dd className="font-semibold">{config.version}</dd></div>
              <div><dt className="text-slate-500">ORBIT fee</dt><dd className="font-semibold">{config.orbitFeePercent}% pilot assumption</dd></div>
              <div><dt className="text-slate-500">Schools</dt><dd className="font-semibold">{config.schoolPercent}%</dd></div>
              <div><dt className="text-slate-500">Operator</dt><dd className="font-semibold">{config.operatorPercent}%</dd></div>
              <div><dt className="text-slate-500">Contributors</dt><dd className="font-semibold">{config.contributorPercent}%</dd></div>
              <div><dt className="text-slate-500">Reject threshold</dt><dd className="font-semibold">{config.contaminationReject}%</dd></div>
            </dl>
          ) : null}
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Permission matrix</h2>
          <div className="mt-4 grid gap-3">
            {Object.entries(permissionsByRole).map(([role, permissions]) => (
              <div key={role} className="rounded-md border border-slate-200 p-3">
                <Badge tone="blue">{role}</Badge>
                <p className="mt-2 text-sm leading-6 text-slate-600">{permissions.join(", ")}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
