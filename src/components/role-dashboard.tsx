import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Factory,
  GraduationCap,
  Info,
  Layers,
  LayoutDashboard,
  QrCode,
  Recycle,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import {
  AlertBanner,
  Badge,
  Card,
  EmptyState,
  LinkButton,
  Metric,
  MobileCard,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { can, type Permission } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { prisma } from "@/lib/db";
import { roleDashboardPath } from "@/lib/role-routes";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg, humanise } from "@/lib/utils";

const roleCopy = {
  SUPER_ADMIN: [
    "Platform Governance & Operations",
    "System-wide data quality, partner oversight, allocation rules, unresolved safety events, and audit compliance.",
  ],
  SCHOOL_ADMIN: [
    "School Waste Collection Center",
    "Coordinate accumulated ready organic waste, bundle batches into pickup requests, track operator dispatch, and monitor school bioenergy credits.",
  ],
  CANTEEN_STAFF: [
    "Canteen Waste Station",
    "Select your assigned reusable container and mark today's organic waste ready for pickup. Verified weighing is performed upon arrival at the community facility.",
  ],
  STUDENT: [
    "Circular Bioenergy Learning Journey",
    "Follow your school's organic waste from the canteen sorting bay to community anaerobic digesters, and see verified clean biogas returns.",
  ],
  OPERATOR: [
    "Logistics & Route Control Panel",
    "Review incoming school pickup requests, schedule vehicle collection routes, track waste in transit, and confirm delivery to community facilities.",
  ],
  COMMUNITY_PARTNER: [
    "Community Processing Center (TPS3R Hub)",
    "Receive arriving containers, perform calibrated weighing & contamination inspection, convert accepted organics into biogas, and manage clean energy returns.",
  ],
} as const;

export async function RoleDashboard({ expectedRole }: { expectedRole: Role }) {
  const user = await requireUser();
  if (user.role !== expectedRole) redirect(roleDashboardPath(user.role));

  const batchWhere =
    user.role === "SUPER_ADMIN" || user.role === "OPERATOR" || user.role === "COMMUNITY_PARTNER"
      ? {}
      : { sourceOrganisationId: user.organisationId };

  const [
    batches,
    inspections,
    cycles,
    allocations,
    alerts,
    auditLogs,
    orgs,
    pickupRequests,
    vehicles,
    userContainers,
  ] = await Promise.all([
    prisma.wasteBatch.findMany({
      where: batchWhere,
      include: { category: true, inspection: true, sourceOrganisation: true, container: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.contaminationInspection.findMany({
      include: { batch: { include: { sourceOrganisation: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.conversionCycle.findMany({
      include: { batches: { include: { batch: true } }, facility: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.energyAllocation.findMany({
      where:
        user.role === "SUPER_ADMIN" || user.role === "OPERATOR" || user.role === "COMMUNITY_PARTNER"
          ? {}
          : { recipientOrgId: user.organisationId },
      include: { fulfilments: true, cycle: true },
      orderBy: { finalisedAt: "desc" },
    }),
    prisma.safetyAlert.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.organisation.findMany({ include: { school: true, facility: true } }),
    prisma.pickupRequest.findMany({
      include: {
        schoolOrganisation: true,
        requestedByUser: true,
        items: { include: { batch: { include: { container: true } } } },
        pickup: { include: { vehicle: true } },
      },
      orderBy: { requestedAt: "desc" },
    }),
    prisma.vehicle.findMany({ orderBy: { label: "asc" } }),
    prisma.wasteContainer.findMany({
      where: user.organisationId ? { organisationId: user.organisationId } : {},
      include: { source: true, category: true },
      orderBy: { containerCode: "asc" },
    }),
  ]);

  const [title, description] = roleCopy[user.role];
  const userOrg = orgs.find((o) => o.id === user.organisationId);

  // General metrics
  const totalAcceptedKg = inspections.reduce((sum, item) => sum + item.acceptedMassKg, 0);
  const totalVerifiedGas = cycles.reduce((sum, item) => sum + item.verifiedGasM3, 0);
  const totalAllocatedGas = allocations.reduce((sum, item) => sum + item.allocatedGasM3, 0);
  const totalFulfilledGas = allocations.reduce(
    (sum, item) => sum + item.fulfilments.reduce((inner, f) => inner + f.volumeM3, 0),
    0,
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          user.role === "CANTEEN_STAFF" ? (
            <LinkButton href="/batches/new">
              <Recycle size={16} /> Register Waste
            </LinkButton>
          ) : user.role === "SCHOOL_ADMIN" ? (
            <LinkButton href="/operations/pickups">
              <CalendarCheck size={16} /> Request Pickup
            </LinkButton>
          ) : user.role === "COMMUNITY_PARTNER" ? (
            <div className="flex gap-2">
              <LinkButton href="/scan" variant="secondary">
                <ScanLine size={16} /> Receive Container
              </LinkButton>
              <LinkButton href="/operations/inspections">
                <ClipboardCheck size={16} /> Weigh & Inspect
              </LinkButton>
            </div>
          ) : user.role === "OPERATOR" ? (
            <LinkButton href="/operations/pickups">
              <Truck size={16} /> Manage Routes
            </LinkButton>
          ) : (
            <LinkButton href="/transparency" variant="secondary">
              Public Transparency
            </LinkButton>
          )
        }
      />

      {/* Recognition & Public Profile Link Banner for Schools & Facilities */}
      {userOrg && userOrg.type !== "PLATFORM" ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--orbit-primary)]/10 text-[var(--orbit-primary)]">
              <Award size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{userOrg.name}</p>
                <Badge tone="green">Verified Partner</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Public profile tracking verified contributions, sorting consistency streaks, and circular energy impact.
              </p>
            </div>
          </div>
          <LinkButton href={`/partners/${userOrg.slug}`} variant="secondary" className="shrink-0 text-xs font-semibold">
            View Public Profile →
          </LinkButton>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 1. CANTEEN STAFF VIEW                                                    */}
      {/* ========================================================================= */}
      {user.role === "CANTEEN_STAFF" ? (
        <div className="grid gap-6">
          <AlertBanner tone="info" title="No On-Site Weighing Required">
            You don&apos;t need to weigh the waste here. Select your reusable container and mark it <strong>Ready for Pickup</strong>. The community waste facility performs official verified weighing and contamination inspection upon delivery.
          </AlertBanner>

          {/* Canteen Task-First Action Hero */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-[var(--orbit-primary)]/20 bg-gradient-to-br from-blue-50/50 to-white md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--orbit-primary)]">
                <Recycle size={16} /> Primary Canteen Task
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Register Today&apos;s Organic Load
              </h2>
              <p className="mt-1 text-sm text-slate-600 max-w-xl">
                Finished sorting food scraps from lunch service? Choose your assigned reusable container to notify the school coordinator for pickup.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <LinkButton href="/batches/new" className="px-5 font-bold shadow-md">
                  <Recycle size={18} /> Register Organic Waste Now
                </LinkButton>
                <LinkButton href="/admin/containers" variant="secondary" className="text-xs">
                  View Assigned Containers ({userContainers.length})
                </LinkButton>
              </div>
            </Card>

            <Card className="flex flex-col justify-between border-l-4 border-l-[var(--orbit-primary)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ready for Pickup
                </p>
                <p className="mt-2 text-4xl font-black text-[var(--orbit-primary)]">
                  {batches.filter((b) => b.status === "READY_FOR_PICKUP").length}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Containers marked ready in canteen sorting bay awaiting school pickup request.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Assigned containers: <strong>{userContainers.length}</strong> active drums
              </div>
            </Card>
          </div>

          {/* Today's / Recent Registered Waste */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Waste Loads</h3>
                <p className="text-xs text-slate-500">Status of registered reusable containers from your canteen</p>
              </div>
              <Link href="/batches" className="text-xs font-bold text-[var(--orbit-primary)] hover:underline">
                View All Batches →
              </Link>
            </div>

            {batches.length === 0 ? (
              <EmptyState
                title="No waste loads registered yet"
                description="When canteen staff register filled containers, they will appear here with live tracking."
                action={<LinkButton href="/batches/new" className="text-xs">Register First Waste Batch</LinkButton>}
              />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {batches.slice(0, 6).map((b) => (
                  <MobileCard key={b.id} className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{b.batchCode}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        Container: {b.container?.containerCode ?? "Standard Drum"}
                      </p>
                      <p className="text-xs text-slate-500">{b.category.name}</p>
                      <div className="mt-3 rounded-md bg-slate-50 p-2.5 text-xs">
                        <span className="text-slate-500">Mass: </span>
                        {b.inspection?.acceptedMassKg ? (
                          <span className="font-bold text-emerald-700">{formatKg(b.inspection.acceptedMassKg)} (Verified)</span>
                        ) : b.declaredMassKg ? (
                          <span className="text-slate-700 font-medium">{formatKg(b.declaredMassKg)} (Estimated)</span>
                        ) : (
                          <span className="text-slate-500 italic">Awaiting facility weighing</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                      <Link href={`/batches/${b.id}`} className="font-bold text-[var(--orbit-primary)] hover:underline">
                        Details →
                      </Link>
                    </div>
                  </MobileCard>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 2. SCHOOL ADMIN VIEW                                                     */}
      {/* ========================================================================= */}
      {user.role === "SCHOOL_ADMIN" ? (
        <div className="grid gap-6">
          {/* Action Required Strip */}
          {(() => {
            const readyBatchesCount = batches.filter((b) => b.status === "READY_FOR_PICKUP").length;
            const pendingRequests = pickupRequests.filter(
              (p) => p.schoolOrganisationId === user.organisationId && p.status === "PENDING_OPERATOR_RESPONSE",
            ).length;
            const inTransitCount = pickupRequests.filter(
              (p) => p.schoolOrganisationId === user.organisationId && (p.status === "IN_TRANSIT" || p.status === "SCHEDULED"),
            ).length;

            return (
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-l-4 border-l-blue-600 bg-blue-50/40">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-900">Ready for Pickup</p>
                    <Badge tone="blue">Action Required</Badge>
                  </div>
                  <p className="mt-2 text-3xl font-black text-slate-900">{readyBatchesCount}</p>
                  <p className="mt-1 text-xs text-slate-600">Container load(s) ready in canteen bay.</p>
                  {readyBatchesCount > 0 ? (
                    <LinkButton href="/operations/pickups" className="mt-3 text-xs w-full">
                      Request Operator Pickup →
                    </LinkButton>
                  ) : null}
                </Card>

                <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Awaiting Response</p>
                    <Badge tone="amber">Logistics</Badge>
                  </div>
                  <p className="mt-2 text-3xl font-black text-slate-900">{pendingRequests}</p>
                  <p className="mt-1 text-xs text-slate-600">Requests submitted to logistics operator.</p>
                </Card>

                <Card className="border-l-4 border-l-emerald-600 bg-emerald-50/30">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Active / In Transit</p>
                    <Badge tone="green">En Route</Badge>
                  </div>
                  <p className="mt-2 text-3xl font-black text-slate-900">{inTransitCount}</p>
                  <p className="mt-1 text-xs text-slate-600">Scheduled vehicle dispatch or en route.</p>
                </Card>
              </div>
            );
          })()}

          {/* School Contribution & Verified Impact Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Verified Accepted Organics"
              value={formatKg(inspections.filter((i) => i.batch.sourceOrganisationId === user.organisationId).reduce((s, i) => s + i.acceptedMassKg, 0))}
              hint="Community-inspected net feedstock"
              confidence="Verified"
            />
            <Metric
              label="Allocated Biogas Credits"
              value={formatGas(allocations.reduce((s, a) => s + a.allocatedGasM3, 0))}
              hint="Earned school energy credit"
              confidence="Calculated"
            />
            <Metric
              label="Fulfilled Clean Energy"
              value={formatGas(allocations.reduce((s, a) => s + a.fulfilments.reduce((sum, f) => sum + f.volumeM3, 0), 0))}
              hint="Delivered bioenergy benefit"
              confidence="Measured"
            />
            <Metric
              label="Total Pickups Completed"
              value={pickupRequests.filter((p) => p.schoolOrganisationId === user.organisationId && p.status === "DELIVERED").length}
              hint="Delivered to community TPS3R"
            />
          </div>

          {/* Active Pickup Tracking */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Collection Tracking</h3>
                <p className="text-xs text-slate-500">Active and recent pickup requests from your school</p>
              </div>
              <LinkButton href="/operations/pickups" variant="secondary" className="text-xs">
                Create New Request →
              </LinkButton>
            </div>

            {pickupRequests.filter((p) => p.schoolOrganisationId === user.organisationId).length === 0 ? (
              <EmptyState
                title="No pickup requests submitted"
                description="When you have waste marked ready by the canteen, submit a collection request for the operator."
                action={<LinkButton href="/operations/pickups" className="text-xs">Request Pickup</LinkButton>}
              />
            ) : (
              <div className="mt-4 grid gap-3">
                {pickupRequests
                  .filter((p) => p.schoolOrganisationId === user.organisationId)
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/40">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{p.requestCode}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {p.items.length} container load(s)
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3 text-slate-600">
                        <div>
                          <span className="text-slate-400">Proposed Window:</span>
                          <p className="font-medium text-slate-900">
                            {new Date(p.proposedPickupStart).toLocaleDateString()} {new Date(p.proposedPickupStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Assigned Vehicle:</span>
                          <p className="font-medium text-slate-900">
                            {p.pickup?.vehicle ? `${p.pickup.vehicle.label} (${p.pickup.vehicle.plate})` : "Awaiting assignment"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Requested By:</span>
                          <p className="font-medium text-slate-900">{p.requestedByUser.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 3. OPERATOR LOGISTICS VIEW                                               */}
      {/* ========================================================================= */}
      {user.role === "OPERATOR" ? (
        <div className="grid gap-6">
          <AlertBanner tone="info" title="Logistics Control Panel Only">
            As the logistics operator, your role is transport coordination: accepting school pickup requests, scheduling vehicle collection, and delivering waste to community TPS3R hubs. Biogas processing, weighing, and energy allocation belong strictly to the community facility.
          </AlertBanner>

          {/* Quick Metrics */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="border-l-4 border-l-amber-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">New Requests</p>
              <p className="mt-1 text-3xl font-black text-amber-600">
                {pickupRequests.filter((p) => p.status === "PENDING_OPERATOR_RESPONSE").length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Awaiting acceptance</p>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Accepted / Scheduled</p>
              <p className="mt-1 text-3xl font-black text-blue-600">
                {pickupRequests.filter((p) => p.status === "ACCEPTED" || p.status === "SCHEDULED").length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Vehicle routing assigned</p>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">In Transit</p>
              <p className="mt-1 text-3xl font-black text-purple-600">
                {pickupRequests.filter((p) => p.status === "IN_TRANSIT").length}
              </p>
              <p className="mt-1 text-xs text-slate-500">En route to facility</p>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivered</p>
              <p className="mt-1 text-3xl font-black text-emerald-600">
                {pickupRequests.filter((p) => p.status === "DELIVERED").length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Safely arrived at hub</p>
            </Card>
          </div>

          {/* Section: New Requests Awaiting Response */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Incoming Collection Demands</h3>
                <p className="text-xs text-slate-500">Accept to schedule logistics or reject with an explanation</p>
              </div>
              <LinkButton href="/operations/pickups" className="text-xs">
                Open Logistics Desk →
              </LinkButton>
            </div>

            {pickupRequests.filter((p) => p.status === "PENDING_OPERATOR_RESPONSE").length === 0 ? (
              <EmptyState
                title="No pending pickup requests"
                description="All school collection requests have been scheduled or completed."
              />
            ) : (
              <div className="mt-4 grid gap-3">
                {pickupRequests
                  .filter((p) => p.status === "PENDING_OPERATOR_RESPONSE")
                  .map((req) => (
                    <MobileCard key={req.id} className="border-amber-200 bg-amber-50/20">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{req.requestCode}</span>
                            <Badge tone="amber">Pending Response</Badge>
                          </div>
                          <p className="mt-1 text-base font-bold text-slate-900">{req.schoolOrganisation.name}</p>
                          <p className="text-xs text-slate-500">Requested by {req.requestedByUser.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[var(--orbit-primary)]">
                            {req.items.length} container load(s)
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg bg-white p-3 text-xs border border-slate-200">
                        <span className="text-slate-400">Proposed Window: </span>
                        <strong>{new Date(req.proposedPickupStart).toLocaleString()}</strong> &mdash; <strong>{new Date(req.proposedPickupEnd).toLocaleTimeString()}</strong>
                        {req.notes ? <p className="mt-1 italic text-slate-600">&ldquo;{req.notes}&rdquo;</p> : null}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <LinkButton href="/operations/pickups" className="text-xs">
                          Review & Respond →
                        </LinkButton>
                      </div>
                    </MobileCard>
                  ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 4. COMMUNITY FACILITY OPERATIONS VIEW                                    */}
      {/* ========================================================================= */}
      {user.role === "COMMUNITY_PARTNER" ? (
        <div className="grid gap-6">
          {/* Operations Center Pipeline */}
          <Card className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              TPS3R Community Hub Operational Pipeline
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
                  <span>1. Receive</span>
                  <ScanLine size={16} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {pickupRequests.filter((p) => p.status === "IN_TRANSIT").length}
                </p>
                <p className="text-[11px] text-slate-500">In-transit loads</p>
                <LinkButton href="/scan" className="mt-3 text-[11px] w-full py-1">
                  Receive Container
                </LinkButton>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                  <span>2. Weigh & Inspect</span>
                  <ClipboardCheck size={16} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {batches.filter((b) => b.status === "DELIVERED").length}
                </p>
                <p className="text-[11px] text-slate-500">Awaiting inspection</p>
                <LinkButton href="/operations/inspections" className="mt-3 text-[11px] w-full py-1">
                  Inspect Batches
                </LinkButton>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                  <span>3. Conversion</span>
                  <Factory size={16} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {batches.filter((b) => b.status === "ACCEPTED" || b.status === "CONDITIONAL").length}
                </p>
                <p className="text-[11px] text-slate-500">Ready for digester</p>
                <LinkButton href="/operations/conversions" className="mt-3 text-[11px] w-full py-1">
                  Start Conversion
                </LinkButton>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                <div className="flex items-center justify-between text-xs text-purple-900 font-bold">
                  <span>4. Allocation</span>
                  <Zap size={16} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {cycles.length}
                </p>
                <p className="text-[11px] text-slate-500">Verified cycles</p>
                <LinkButton href="/operations/allocations" variant="secondary" className="mt-3 text-[11px] w-full py-1">
                  View Allocations
                </LinkButton>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-800 font-bold">
                  <span>5. Fulfilment</span>
                  <Award size={16} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {allocations.length}
                </p>
                <p className="text-[11px] text-slate-500">Allocated pools</p>
                <LinkButton href="/operations/fulfilment" variant="secondary" className="mt-3 text-[11px] w-full py-1">
                  Fulfil Energy
                </LinkButton>
              </div>
            </div>
          </Card>

          {/* Facility Performance Metrics */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Metric
              label="Net Accepted Organics"
              value={formatKg(totalAcceptedKg)}
              hint="Calibrated facility scale weight"
              confidence="Verified"
            />
            <Metric
              label="Verified Physical Biogas"
              value={formatGas(totalVerifiedGas)}
              hint="Physical gas flow meter logs"
              confidence="Measured"
            />
            <Metric
              label="Energy Fulfilled"
              value={formatGas(totalFulfilledGas)}
              hint="Delivered bioenergy benefit"
              confidence="Measured"
            />
            <Metric
              label="Active Digester Batches"
              value={cycles.length}
              hint="Completed conversion cycles"
            />
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 5. STUDENT VIEW                                                          */}
      {/* ========================================================================= */}
      {user.role === "STUDENT" ? (
        <div className="grid gap-6">
          {/* Circular Bioenergy Journey */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[var(--orbit-energy)]" size={20} />
              <h2 className="text-lg font-bold text-slate-950">How ORBIT Works: The Circular Bioenergy Journey</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              See how your canteen food scraps become clean cooking gas for schools and community kitchens.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-800 text-xs font-bold mb-2">1</span>
                <p className="font-bold text-slate-900 text-sm">Source Sorting</p>
                <p className="mt-1 text-xs text-slate-600">Students & canteen staff separate food scraps from plastics and wrappers.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold mb-2">2</span>
                <p className="font-bold text-slate-900 text-sm">Clean Logistics</p>
                <p className="mt-1 text-xs text-slate-600">Scheduled vehicles collect ready reusable containers and deliver them to TPS3R.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">3</span>
                <p className="font-bold text-slate-900 text-sm">Anaerobic Digestion</p>
                <p className="mt-1 text-xs text-slate-600">Microorganisms break down accepted organic matter in sealed biodigesters.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-green-100 text-green-800 text-xs font-bold mb-2">4</span>
                <p className="font-bold text-slate-900 text-sm">Clean Bioenergy</p>
                <p className="mt-1 text-xs text-slate-600">Verified clean biogas is returned to schools (50%) and community facility (30%).</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/student/journey" className="text-xs">
                Explore Full Interactive Journey →
              </LinkButton>
              <LinkButton href="/student/learn" variant="secondary" className="text-xs">
                Why Feedstock Purity Matters →
              </LinkButton>
            </div>
          </Card>

          {/* School Impact Explorer */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">School Accepted Organics</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {formatKg(inspections.filter((i) => i.batch.sourceOrganisationId === user.organisationId).reduce((s, i) => s + i.acceptedMassKg, 0))}
              </p>
              <p className="mt-1 text-xs text-slate-500">Sorted & verified by community hub</p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">School Biogas Earned</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">
                {formatGas(allocations.reduce((s, a) => s + a.allocatedGasM3, 0))}
              </p>
              <p className="mt-1 text-xs text-slate-500">Allocated clean energy return</p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Safety Boundary</p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Students participate through sorting, software, and learning. Gas equipment, valves, and biodigestion are operated exclusively by trained adults.
              </p>
            </Card>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 6. SUPER ADMIN GOVERNANCE VIEW                                           */}
      {/* ========================================================================= */}
      {user.role === "SUPER_ADMIN" ? (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Metric label="Total Accepted Organics" value={formatKg(totalAcceptedKg)} confidence="Verified" />
            <Metric label="Total Verified Biogas" value={formatGas(totalVerifiedGas)} confidence="Measured" />
            <Metric label="Total Allocated Energy" value={formatGas(totalAllocatedGas)} confidence="Calculated" />
            <Metric label="Total Fulfilled Energy" value={formatGas(totalFulfilledGas)} confidence="Measured" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Partner Organisations</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{orgs.length}</p>
              <LinkButton href="/admin/users" variant="secondary" className="mt-3 text-xs w-full">
                Manage Organisations & Users →
              </LinkButton>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Facilities</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {orgs.filter((o) => o.facility).length}
              </p>
              <LinkButton href="/admin/facilities" variant="secondary" className="mt-3 text-xs w-full">
                Manage Facilities →
              </LinkButton>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Safety & Unresolved Alerts</p>
              <p className="mt-2 text-3xl font-black text-red-600">{alerts.length}</p>
              <LinkButton href="/admin/safety" variant="secondary" className="mt-3 text-xs w-full">
                Review Safety Desk →
              </LinkButton>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
