import { redirect } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  Factory,
  QrCode,
  ShieldAlert,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { Badge, Card, LinkButton, Metric, PageHeader } from "@/components/ui";
import { can, type Permission } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { prisma } from "@/lib/db";
import { roleDashboardPath } from "@/lib/role-routes";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";

const roleCopy = {
  SUPER_ADMIN: [
    "Super Admin Dashboard",
    "System-wide data quality, facility validation, allocation configuration, unresolved safety events, and audit activity.",
  ],
  SCHOOL_ADMIN: [
    "School Admin Dashboard",
    "Accepted school waste, contamination trend, allocation, fulfilment, estimated savings, upcoming pickups, and student participation.",
  ],
  CANTEEN_STAFF: [
    "Canteen Staff Dashboard",
    "Mobile-first next actions for creating batches, preparing pickup, and learning from inspection feedback.",
  ],
  STUDENT: [
    "Student Dashboard",
    "Waste journey, sorting accuracy, contamination reduction, class learning, and school impact without gas-equipment instructions.",
  ],
  OPERATOR: [
    "Operator Dashboard",
    "Incoming feedstock, pickup schedule, inspections, conversion cycles, verified gas, fulfilment, maintenance, and safety alerts.",
  ],
  COMMUNITY_PARTNER: [
    "Community Partner Dashboard",
    "Community allocation, energy use, fulfilment history, and local benefit.",
  ],
} as const;

const nextActions: Record<Role, Array<{ label: string; href: string; permission?: Permission }>> = {
  SUPER_ADMIN: [
    { label: "Manage organisations", href: "/admin/users", permission: "manage_org" },
    { label: "Review audit logs", href: "/admin/audit", permission: "view_audit" },
    { label: "Open impact report", href: "/reports/impact", permission: "view_reports" },
  ],
  SCHOOL_ADMIN: [
    { label: "Open impact report", href: "/reports/impact", permission: "view_reports" },
    { label: "Open sustainability report", href: "/reports/sustainability", permission: "view_reports" },
    { label: "Review school batches", href: "/batches" },
  ],
  CANTEEN_STAFF: [
    { label: "Create Batch", href: "/batches/new", permission: "create_batch" },
    { label: "Review batches", href: "/batches" },
  ],
  STUDENT: [
    { label: "Open QR Scanner", href: "/scan", permission: "view_student" },
    { label: "View public impact", href: "/impact" },
  ],
  OPERATOR: [
    { label: "Schedule pickup", href: "/operations/pickups", permission: "schedule_pickup" },
    { label: "Inspect delivered batch", href: "/operations/inspections", permission: "inspect_batch" },
    { label: "Record verified gas", href: "/operations/conversions", permission: "record_conversion" },
  ],
  COMMUNITY_PARTNER: [
    { label: "Open impact report", href: "/reports/impact", permission: "view_reports" },
    { label: "Open sustainability report", href: "/reports/sustainability", permission: "view_reports" },
    { label: "Trace a batch", href: "/scan" },
  ],
};

export async function RoleDashboard({ expectedRole }: { expectedRole: Role }) {
  const user = await requireUser();
  if (user.role !== expectedRole) redirect(roleDashboardPath(user.role));

  const batchWhere =
    user.role === "SUPER_ADMIN" || user.role === "OPERATOR" || user.role === "COMMUNITY_PARTNER"
      ? {}
      : { sourceOrganisationId: user.organisationId };
  const [batches, inspections, cycles, allocations, alerts, auditLogs, orgs] = await Promise.all([
    prisma.wasteBatch.findMany({
      where: batchWhere,
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
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.organisation.findMany(),
  ]);

  const acceptedMass = inspections.reduce((sum, item) => sum + item.acceptedMassKg, 0);
  const verifiedGas = cycles.reduce((sum, item) => sum + item.verifiedGasM3, 0);
  const allocation = allocations.reduce((sum, item) => sum + item.allocatedGasM3, 0);
  const fulfilled = allocations.reduce(
    (sum, item) => sum + item.fulfilments.reduce((inner, fulfilment) => inner + fulfilment.volumeM3, 0),
    0,
  );
  const [title, description] = roleCopy[user.role];
  const waitingPickup = batches.filter((batch) => batch.status === "READY_FOR_PICKUP").length;
  const rejected = inspections.filter((inspection) => inspection.decision === "REJECTED").length;
  const actions = nextActions[user.role].filter((action) => !action.permission || can(user.role, action.permission));

  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          user.role === "CANTEEN_STAFF" ? (
            <LinkButton href="/batches/new">Create Batch</LinkButton>
          ) : (
            <LinkButton href="/transparency" variant="secondary">
              Public transparency
            </LinkButton>
          )
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Accepted organic waste" value={formatKg(acceptedMass)} hint="Operator-inspected accepted mass." />
        <Metric label="Verified biogas" value={formatGas(verifiedGas)} hint="Measured cycle records, not estimates." />
        <Metric label="Allocated biogas" value={formatGas(allocation)} hint="Finalised allocation versions." />
        <Metric label="Fulfilled biogas" value={formatGas(fulfilled)} hint="Unfulfilled allocation is not delivered energy." />
      </div>

      {user.role === "CANTEEN_STAFF" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <QrCode className="text-teal-700" />
            <h2 className="mt-3 font-bold">Create the next QR batch</h2>
            <p className="mt-2 text-sm text-slate-600">Register only source-separated organics ready for pickup.</p>
            <LinkButton href="/batches/new" className="mt-4">
              Create Batch
            </LinkButton>
          </Card>
          <Card>
            <Truck className="text-amber-600" />
            <h2 className="mt-3 font-bold">Waiting for pickup</h2>
            <p className="mt-2 text-2xl font-bold">{waitingPickup}</p>
            <p className="text-sm text-slate-600">Prepare covered bins and labels.</p>
          </Card>
          <Card>
            <ClipboardCheck className="text-red-700" />
            <h2 className="mt-3 font-bold">Feedback to improve</h2>
            <p className="mt-2 text-2xl font-bold">{rejected}</p>
            <p className="text-sm text-slate-600">Rejected demo inspections indicate sorting issues.</p>
          </Card>
        </div>
      ) : null}

      {user.role === "STUDENT" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <BookOpen className="text-teal-700" />
            <h2 className="mt-3 font-bold">Follow the waste journey</h2>
            <p className="mt-2 text-sm text-slate-600">Scan permitted QR labels and learn how contamination changes outcomes.</p>
            <LinkButton href="/scan" className="mt-4">
              Open QR Scanner
            </LinkButton>
          </Card>
          <Card>
            <Zap className="text-amber-600" />
            <h2 className="mt-3 font-bold">School energy impact</h2>
            <p className="mt-2 text-2xl font-bold">{formatGas(allocation)}</p>
            <p className="text-sm text-slate-600">Allocated energy is separate from delivered energy.</p>
          </Card>
          <Card>
            <ShieldAlert className="text-slate-700" />
            <h2 className="mt-3 font-bold">Safety boundary</h2>
            <p className="mt-2 text-sm text-slate-600">Students do not handle biodigesters, gas bags, valves, or hazardous machinery.</p>
          </Card>
        </div>
      ) : null}

      {user.role === "SUPER_ADMIN" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Users className="text-teal-700" />
            <h2 className="mt-3 font-bold">Active organisations</h2>
            <p className="mt-2 text-2xl font-bold">{orgs.length}</p>
          </Card>
          <Card>
            <ShieldAlert className="text-amber-600" />
            <h2 className="mt-3 font-bold">Unresolved warnings</h2>
            <p className="mt-2 text-2xl font-bold">{alerts.length}</p>
          </Card>
          <Card>
            <Factory className="text-slate-700" />
            <h2 className="mt-3 font-bold">Audit activity</h2>
            <div className="mt-3 grid gap-2">
              {auditLogs.map((log) => (
                <p key={log.id} className="text-sm text-slate-600">
                  {log.action.replaceAll("_", " ")}
                </p>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {user.role === "OPERATOR" || user.role === "SCHOOL_ADMIN" || user.role === "COMMUNITY_PARTNER" ? (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">
              {user.role === "OPERATOR" ? "Incoming feedstock and inspections" : "Recent contribution records"}
            </h2>
            <div className="mt-4 overflow-x-auto">
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
                      <td>
                        <Badge tone={batch.status === "REJECTED" ? "red" : batch.status === "CONDITIONAL" ? "amber" : "green"}>
                          {batch.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td>{formatKg(batch.grossWeightKg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Next actions</h2>
            <div className="mt-4 grid gap-3">
              {actions.map((action) => (
                <LinkButton key={action.href} href={action.href} variant="secondary">
                  {action.label}
                </LinkButton>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

