import { redirect } from "next/navigation";
import {
  Award,
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
    "System-wide data quality, partner management, allocation configuration, unresolved safety events, and audit activity.",
  ],
  SCHOOL_ADMIN: [
    "School Admin Dashboard",
    "Manage accumulated ready organic waste, create multi-item pickup requests, monitor operator acceptance, and track energy credits.",
  ],
  CANTEEN_STAFF: [
    "Canteen Staff Dashboard",
    "Scan assigned reusable QR containers, enter declared weight & category, and register today's organic waste loads.",
  ],
  STUDENT: [
    "Student Dashboard",
    "Waste journey, sorting accuracy, contamination reduction, class learning, and school impact without gas-equipment instructions.",
  ],
  OPERATOR: [
    "Bioenergy Operator Dashboard",
    "Manage incoming school pickup requests, vehicle fleet routing, facility contamination inspections, conversion cycles, and gas fulfilment.",
  ],
  COMMUNITY_PARTNER: [
    "Community Partner Showcase",
    "Monitor community energy benefits, local allocation fulfilment, facility throughput performance, and public sustainability impact.",
  ],
} as const;

const nextActions: Record<Role, Array<{ label: string; href: string; permission?: Permission }>> = {
  SUPER_ADMIN: [
    { label: "Manage partner organisations", href: "/admin/users", permission: "manage_org" },
    { label: "Manage QR containers", href: "/admin/containers", permission: "manage_containers" },
    { label: "Review audit logs", href: "/admin/audit", permission: "view_audit" },
    { label: "Open impact report", href: "/reports/impact", permission: "view_reports" },
  ],
  SCHOOL_ADMIN: [
    { label: "Request pickup for ready waste", href: "/operations/pickups", permission: "request_pickup" },
    { label: "Review school batches", href: "/batches" },
    { label: "Open impact report", href: "/reports/impact", permission: "view_reports" },
    { label: "Open sustainability report", href: "/reports/sustainability", permission: "view_reports" },
  ],
  CANTEEN_STAFF: [
    { label: "Register Organic Load", href: "/batches/new", permission: "create_waste_record" },
    { label: "Scan QR Container", href: "/scan" },
    { label: "Review batches", href: "/batches" },
  ],
  STUDENT: [
    { label: "Open QR Scanner", href: "/scan", permission: "view_student" },
    { label: "View public impact", href: "/impact" },
  ],
  OPERATOR: [
    { label: "Incoming pickup requests", href: "/operations/pickups", permission: "respond_pickup_request" },
    { label: "Facility quality inspection", href: "/operations/inspections", permission: "inspect_batch" },
    { label: "Record conversion cycle & gas", href: "/operations/conversions", permission: "record_conversion" },
    { label: "Calculate energy allocation", href: "/operations/allocations", permission: "calculate_allocation" },
    { label: "Fulfil energy allocation", href: "/operations/fulfilment", permission: "fulfil_allocation" },
  ],
  COMMUNITY_PARTNER: [
    { label: "View community allocations", href: "/operations/allocations", permission: "view_reports" },
    { label: "View fulfilment status", href: "/operations/fulfilment", permission: "view_reports" },
    { label: "Open impact report", href: "/reports/impact", permission: "view_reports" },
  ],
};

export async function RoleDashboard({ expectedRole }: { expectedRole: Role }) {
  const user = await requireUser();
  if (user.role !== expectedRole) redirect(roleDashboardPath(user.role));

  const batchWhere =
    user.role === "SUPER_ADMIN" || user.role === "OPERATOR" || user.role === "COMMUNITY_PARTNER"
      ? {}
      : { sourceOrganisationId: user.organisationId };
  const [batches, inspections, cycles, allocations, alerts, auditLogs, orgs, pendingRequests] = await Promise.all([
    prisma.wasteBatch.findMany({
      where: batchWhere,
      include: { category: true, inspection: true, sourceOrganisation: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.contaminationInspection.findMany(),
    prisma.conversionCycle.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.energyAllocation.findMany({
      where:
        user.role === "SUPER_ADMIN" || user.role === "OPERATOR" || user.role === "COMMUNITY_PARTNER"
          ? {}
          : { recipientOrgId: user.organisationId },
      include: { fulfilments: true },
    }),
    prisma.safetyAlert.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.organisation.findMany(),
    prisma.pickupRequest.findMany({
      where: { status: "PENDING_OPERATOR_RESPONSE" },
      include: { items: true },
    }),
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

  const userOrg = orgs.find((o) => o.id === user.organisationId);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          user.role === "CANTEEN_STAFF" ? (
            <LinkButton href="/batches/new">Register Load</LinkButton>
          ) : user.role === "SCHOOL_ADMIN" ? (
            <LinkButton href="/operations/pickups">Request Pickup</LinkButton>
          ) : (
            <LinkButton href="/transparency" variant="secondary">
              Public transparency
            </LinkButton>
          )
        }
      />
      {userOrg && userOrg.type !== "PLATFORM" ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--orbit-primary)]/10 text-[var(--orbit-primary)]">
              <Award size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">Your Public Impact & Recognition Profile</p>
                <Badge tone="green">Active Partner</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Track your organisation&apos;s weekly contribution streak, sorting acceptance rate, and unlocked badges on the ORBIT Partner Network.
              </p>
            </div>
          </div>
          <LinkButton href={`/partners/${userOrg.slug}`} variant="secondary" className="shrink-0 text-xs">
            View Public Profile →
          </LinkButton>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Accepted organic waste" value={formatKg(acceptedMass)} hint="Operator-inspected accepted mass." />
        <Metric label="Verified biogas" value={formatGas(verifiedGas)} hint="Measured cycle records, not estimates." />
        <Metric label="Allocated biogas" value={formatGas(allocation)} hint="Finalised allocation versions." />
        <Metric label="Fulfilled biogas" value={formatGas(fulfilled)} hint="Delivered energy output." />
      </div>

      {user.role === "CANTEEN_STAFF" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <QrCode className="text-[var(--orbit-primary)]" />
            <h2 className="mt-3 font-bold">Register Container Load</h2>
            <p className="mt-2 text-sm text-slate-600">Scan assigned reusable container QR tags to enter today&apos;s organic waste weight.</p>
            <LinkButton href="/batches/new" className="mt-4">
              Register Load
            </LinkButton>
          </Card>
          <Card>
            <Truck className="text-[var(--orbit-secondary)]" />
            <h2 className="mt-3 font-bold">Ready containers</h2>
            <p className="mt-2 text-2xl font-bold">{waitingPickup}</p>
            <p className="text-sm text-slate-600">Containers prepared in canteen storage bay.</p>
          </Card>
          <Card>
            <ClipboardCheck className="text-red-700" />
            <h2 className="mt-3 font-bold">Inspection feedback</h2>
            <p className="mt-2 text-2xl font-bold">{rejected}</p>
            <p className="text-sm text-slate-600">Sorting contamination feedback from facility operators.</p>
          </Card>
        </div>
      ) : null}

      {user.role === "OPERATOR" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-amber-500">
            <Truck className="text-amber-600" />
            <h2 className="mt-3 font-bold">Pending Pickup Requests</h2>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">{pendingRequests.length}</p>
            <p className="text-sm text-slate-600">Collection requests awaiting operator review.</p>
            <LinkButton href="/operations/pickups" className="mt-4" variant="secondary">
              Review Requests
            </LinkButton>
          </Card>
          <Card>
            <Factory className="text-[var(--orbit-primary)]" />
            <h2 className="mt-3 font-bold">Verified Biogas Cycles</h2>
            <p className="mt-2 text-3xl font-extrabold text-black">{cycles.length}</p>
            <p className="text-sm text-slate-600">Completed conversion batches at facility.</p>
          </Card>
          <Card>
            <ShieldAlert className="text-slate-700" />
            <h2 className="mt-3 font-bold">Biodigester Safety</h2>
            <p className="mt-2 text-3xl font-extrabold text-black">{alerts.length}</p>
            <p className="text-sm text-slate-600">Active facility pressure & safety alerts.</p>
          </Card>
        </div>
      ) : null}

      {user.role === "STUDENT" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <BookOpen className="text-[var(--orbit-primary)]" />
            <h2 className="mt-3 font-bold">Follow the waste journey</h2>
            <p className="mt-2 text-sm text-slate-600">Scan permitted QR labels and learn how contamination changes outcomes.</p>
            <LinkButton href="/scan" className="mt-4">
              Open QR Scanner
            </LinkButton>
          </Card>
          <Card>
            <Zap className="text-[var(--orbit-energy)]" />
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
            <Users className="text-[var(--orbit-primary)]" />
            <h2 className="mt-3 font-bold">Active organisations</h2>
            <p className="mt-2 text-2xl font-bold">{orgs.length}</p>
          </Card>
          <Card>
            <ShieldAlert className="text-[var(--orbit-secondary)]" />
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
              {user.role === "OPERATOR" ? "Recent feedstock batches" : "Recent contribution records"}
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
                      <td className="py-3 font-semibold text-[var(--orbit-primary)]">{batch.batchCode}</td>
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
