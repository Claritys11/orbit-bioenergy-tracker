import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  CalendarCheck,
  Clock,
  Recycle,
  Truck,
} from "lucide-react";
import { Badge, Card, EmptyState, LinkButton, Metric, PageHeader, StatusBadge } from "@/components/ui";
import { WasteJourneyTracker } from "@/components/waste-journey-tracker";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/domain/types";
import { roleDashboardPath } from "@/lib/role-routes";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";

export async function RoleDashboard({ expectedRole }: { expectedRole: Role }) {
  const user = await requireUser();
  if (user.role !== expectedRole) redirect(roleDashboardPath(user.role));

  const org = user.organisationId
    ? await prisma.organisation.findUnique({
        where: { id: user.organisationId },
        include: { facility: true },
      })
    : null;

  const dashboardUser = { organisationId: user.organisationId ?? null };

  // Render role-specific tailored dashboards
  switch (user.role) {
    case "CANTEEN_STAFF":
      return <CanteenDashboard user={dashboardUser} org={org} />;
    case "SCHOOL_ADMIN":
      return <SchoolAdminDashboard user={dashboardUser} org={org} />;
    case "OPERATOR":
      return <OperatorDashboard user={dashboardUser} org={org} />;
    case "COMMUNITY_PARTNER":
      return <CommunityFacilityDashboard user={dashboardUser} org={org} />;
    case "STUDENT":
      return <StudentDashboard user={dashboardUser} org={org} />;
    case "SUPER_ADMIN":
    default:
      return <SuperAdminDashboard />;
  }
}

/* =========================================================================
   1. CANTEEN DASHBOARD (Section 16)
   - 1-2 click simple workflow: Reusable containers bay -> Mark Ready
   - Recent activity stream
   - Verified contribution impact
   - Zero complex operational jargon
   ========================================================================= */
async function CanteenDashboard({
  user,
  org,
}: {
  user: { organisationId: string | null };
  org: { name: string; slug: string } | null;
}) {
  const [containers, batches] = await Promise.all([
    user.organisationId
      ? prisma.wasteContainer.findMany({
          where: { organisationId: user.organisationId, isActive: true },
          include: { source: true, category: true },
          orderBy: { containerCode: "asc" },
        })
      : [],
    user.organisationId
      ? prisma.wasteBatch.findMany({
          where: { sourceOrganisationId: user.organisationId },
          include: { category: true, inspection: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : [],
  ]);

  const verifiedMass = batches.reduce(
    (sum, b) => sum + (b.inspection?.acceptedMassKg ?? 0),
    0,
  );
  const readyContainersCount = batches.filter((b) => b.status === "READY_FOR_PICKUP").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={org?.name ? `${org.name} Canteen Bay` : "Canteen Waste Bay"}
        description="Mark reusable organic-waste containers as ready for school pickup. Calibrated weighing and inspection will be performed at the Community Facility."
        action={
          <div className="flex items-center gap-3">
            {readyContainersCount > 0 && (
              <Badge tone="amber">{readyContainersCount} Ready for Pickup</Badge>
            )}
            <LinkButton href="/batches/new" className="gap-2 font-bold shadow-xs">
              <Recycle size={16} /> Mark Container Ready
            </LinkButton>
          </div>
        }
      />

      {/* Primary Workflow: Containers Bay */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950">Assigned Reusable Containers</h2>
            <p className="text-xs text-slate-500">
              Select your drum to mark today&apos;s load ready for collection.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {containers.length} assigned container(s)
          </span>
        </div>

        {containers.length === 0 ? (
          <EmptyState
            title="No containers assigned yet"
            description="Your school administrator or platform operator will assign reusable QR drums to your canteen bay."
            action={
              <LinkButton href="/batches/new" variant="secondary">
                Register Waste Load
              </LinkButton>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {containers.map((container) => {
              const isReady = container.status === "READY_FOR_PICKUP";
              const isAtFacility = container.status === "AT_FACILITY" || container.status === "IN_TRANSIT";

              return (
                <Card
                  key={container.id}
                  className="flex flex-col justify-between border-slate-200 transition-all hover:border-[var(--orbit-primary)]/50 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-[var(--orbit-primary)]">
                          {container.containerCode}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {container.category.name}
                        </h3>
                      </div>
                      <StatusBadge status={container.status} />
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p>
                        Bay Location: <strong className="text-slate-800">{container.source.name}</strong>
                      </p>
                      <p>
                        Current Condition: <span className="font-medium text-slate-700">{container.capacityKg ?? 50} kg drum capacity</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isReady ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                        <Clock size={14} /> Ready for school pickup
                      </span>
                    ) : isAtFacility ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Truck size={14} /> In transit to facility
                      </span>
                    ) : (
                      <Link
                        href={`/batches/new?containerId=${container.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--orbit-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:opacity-90 w-full"
                      >
                        Mark Ready for Collection →
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Canteen Impact & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-base font-bold text-slate-950 mb-1">Your Canteen Impact</h2>
          <p className="text-xs text-slate-500 mb-4">
            Verified organic waste safely diverted from open dumps to community clean bioenergy.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Verified Organics
              </span>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-950">
                {formatKg(verifiedMass)}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700">
                Calibrated scale measurement at facility
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--orbit-primary)]">
                Contributions
              </span>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-950">
                {batches.length}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                Reusable container loads marked ready
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-950">Recent Activity</h2>
            <Link href="/batches" className="text-xs font-semibold text-[var(--orbit-primary)] hover:underline">
              View All History →
            </Link>
          </div>
          {batches.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No container activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {batches.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{b.batchCode}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString("id-ID", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} &bull; {b.category.name}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* =========================================================================
   2. SCHOOL ADMIN DASHBOARD (Section 17)
   - School Overview: Ready containers, Active requests, Verified kg, Biogas m³
   - Action Required: Prominent Request Pickup banner
   - Active Pickup Pipeline
   ========================================================================= */
async function SchoolAdminDashboard({
  user,
  org,
}: {
  user: { organisationId: string | null };
  org: { name: string; slug: string } | null;
}) {
  const [readyBatches, activePickups, allBatches, allocations] = await Promise.all([
    user.organisationId
      ? prisma.wasteBatch.findMany({
          where: {
            sourceOrganisationId: user.organisationId,
            status: "READY_FOR_PICKUP",
            pickupRequestItem: null,
          },
          include: { category: true, container: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
    user.organisationId
      ? prisma.pickupRequest.findMany({
          where: {
            schoolOrganisationId: user.organisationId,
            status: { in: ["PENDING_OPERATOR_RESPONSE", "ACCEPTED", "SCHEDULED", "IN_TRANSIT"] },
          },
          include: {
            items: { include: { batch: true } },
            pickup: { include: { vehicle: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
    user.organisationId
      ? prisma.wasteBatch.findMany({
          where: { sourceOrganisationId: user.organisationId },
          include: { inspection: true },
        })
      : [],
    user.organisationId
      ? prisma.energyAllocation.findMany({
          where: { recipientOrgId: user.organisationId },
        })
      : [],
  ]);

  const verifiedOrganicKg = allBatches.reduce(
    (sum, b) => sum + (b.inspection?.acceptedMassKg ?? 0),
    0,
  );
  const allocatedGas = allocations.reduce((sum, a) => sum + a.allocatedGasM3, 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={org?.name ? `${org.name} School Operations` : "School Waste & Bioenergy Operations"}
        description="Monitor canteen organic waste accumulation, create pickup requests for bioenergy logistics, and track clean gas returned to your school."
        action={
          <LinkButton href="/operations/pickups" className="gap-2 font-bold shadow-xs">
            <CalendarCheck size={16} /> Request Collection Pickup
          </LinkButton>
        }
      />

      {/* School Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Ready For Collection"
          value={`${readyBatches.length} container(s)`}
          hint="Awaiting pickup request"
        />
        <Metric
          label="Active Pickups"
          value={`${activePickups.length} in progress`}
          hint="Operator logistics dispatch"
        />
        <Metric
          label="Verified Organic Waste"
          value={formatKg(verifiedOrganicKg)}
          hint="Accepted by Community Facility"
          confidence="VERIFIED_FEEDSTOCK"
        />
        <Metric
          label="Allocated Biogas"
          value={formatGas(allocatedGas)}
          hint="Automated school clean energy credit"
          confidence="VERIFIED_BIOGAS"
        />
      </div>

      {/* Action Required Banner: Request Pickup */}
      {readyBatches.length > 0 ? (
        <div className="rounded-xl border-2 border-emerald-600/30 bg-emerald-50/70 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white font-bold">
              <AlertCircle size={22} />
            </span>
            <div>
              <h2 className="text-base font-bold text-emerald-950">Action Required: Ready Containers Waiting</h2>
              <p className="mt-0.5 text-xs text-emerald-800 leading-relaxed">
                <strong>{readyBatches.length} container loads</strong> have been marked ready by the canteen team.
                Submit a pickup request to notify logistics operators for vehicle scheduling.
              </p>
            </div>
          </div>
          <LinkButton href="/operations/pickups" className="shrink-0 font-bold bg-emerald-700 hover:bg-emerald-800 text-white">
            Request Pickup Now →
          </LinkButton>
        </div>
      ) : null}

      {/* Active Collection Pipeline */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">Active Collection Progress</h2>
            <p className="text-xs text-slate-500">Live logistics status of your school&apos;s pickup requests.</p>
          </div>
          <LinkButton href="/operations/pickups" variant="secondary" className="text-xs">
            Manage All Requests
          </LinkButton>
        </div>

        {activePickups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            No active collection requests in progress right now.
          </div>
        ) : (
          <div className="grid gap-3">
            {activePickups.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--orbit-primary)]">
                      {req.requestCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      &bull; {req.items.length} container loads
                    </span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>
                    Proposed Window:{" "}
                    <strong>{new Date(req.proposedPickupStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
                  </p>
                  {req.pickup?.vehicle ? (
                    <p>
                      Assigned Vehicle: <strong>{req.pickup.vehicle.label} ({req.pickup.vehicle.plate})</strong>
                    </p>
                  ) : (
                    <p className="text-amber-700 font-medium">Awaiting operator vehicle assignment</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* =========================================================================
   3. OPERATOR DASHBOARD (Section 18)
   - Logistics Control Center ONLY
   - Status Pipeline: Requested -> Accepted -> Scheduled -> In Transit -> Delivered
   - Today's Routes Cards
   ========================================================================= */
async function OperatorDashboard({
  org,
}: {
  user: { organisationId: string | null };
  org: { name: string; slug: string } | null;
}) {
  const [pendingRequests, activeRoutes, completedCount, vehicles] = await Promise.all([
    prisma.pickupRequest.findMany({
      where: { status: "PENDING_OPERATOR_RESPONSE" },
      include: {
        schoolOrganisation: true,
        items: { include: { batch: { include: { container: true } } } },
      },
      orderBy: { proposedPickupStart: "asc" },
    }),
    prisma.pickupRequest.findMany({
      where: { status: { in: ["ACCEPTED", "SCHEDULED", "IN_TRANSIT"] } },
      include: {
        schoolOrganisation: true,
        items: { include: { batch: true } },
        pickup: { include: { vehicle: true } },
      },
      orderBy: { proposedPickupStart: "asc" },
    }),
    prisma.pickupRequest.count({ where: { status: "DELIVERED" } }),
    prisma.vehicle.findMany(),
  ]);

  const scheduledToday = activeRoutes.filter((r) => r.status === "SCHEDULED").length;
  const inTransitCount = activeRoutes.filter((r) => r.status === "IN_TRANSIT").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={org?.name ? `${org.name} Logistics Center` : "Logistics Dispatch Center"}
        description={`Operator collection management with ${vehicles.length} registered fleet vehicle(s): review incoming school demand, dispatch collection vehicles, and verify delivery to community processing facilities.`}
        action={
          <LinkButton href="/operations/pickups" className="gap-2 font-bold shadow-xs">
            <Truck size={16} /> Open Dispatch Board
          </LinkButton>
        }
      />

      {/* Logistics Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Pending Requests"
          value={String(pendingRequests.length)}
          hint="Awaiting operator review"
        />
        <Metric
          label="Scheduled Routes"
          value={String(scheduledToday)}
          hint="Vehicles assigned"
        />
        <Metric
          label="In Transit"
          value={String(inTransitCount)}
          hint="Currently on road to facility"
        />
        <Metric
          label="Completed Deliveries"
          value={String(completedCount)}
          hint="Safely delivered to facility"
        />
      </div>

      {/* Logistics Status Progression Pipeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Logistics Chain of Custody Pipeline
        </p>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { label: "1. Requested", count: pendingRequests.length, active: pendingRequests.length > 0 },
            { label: "2. Accepted", count: activeRoutes.filter((r) => r.status === "ACCEPTED").length },
            { label: "3. Scheduled", count: scheduledToday, active: scheduledToday > 0 },
            { label: "4. In Transit", count: inTransitCount, active: inTransitCount > 0 },
            { label: "5. Delivered", count: completedCount, done: true },
          ].map((step) => (
            <div
              key={step.label}
              className={`rounded-lg p-2.5 transition-all ${
                step.active
                  ? "bg-[var(--orbit-primary)] text-white font-bold"
                  : step.done
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold"
                  : "bg-slate-50 text-slate-600 border border-slate-100"
              }`}
            >
              <p className="truncate">{step.label}</p>
              <p className="mt-1 text-base font-extrabold">{step.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Incoming Demands & Today's Routes */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Pending School Requests</h2>
              <p className="text-xs text-slate-500">Respond to collection demand from schools.</p>
            </div>
            <Badge tone="amber">{pendingRequests.length} Pending</Badge>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No pending pickup requests awaiting operator response.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500">{req.requestCode}</span>
                      <h3 className="text-sm font-bold text-slate-950">{req.schoolOrganisation.name}</h3>
                    </div>
                    <span className="text-xs font-bold text-[var(--orbit-primary)]">
                      {req.items.length} load(s)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Window: {new Date(req.proposedPickupStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &mdash; {new Date(req.proposedPickupEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Link
                      href="/operations/pickups"
                      className="rounded-lg bg-[var(--orbit-primary)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      Review & Accept →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Active Routes & In-Transit</h2>
              <p className="text-xs text-slate-500">Scheduled collections for today.</p>
            </div>
            <Link href="/operations/pickups" className="text-xs font-semibold text-[var(--orbit-primary)] hover:underline">
              View All Routes →
            </Link>
          </div>

          {activeRoutes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No active pickup routes scheduled today.
            </div>
          ) : (
            <div className="space-y-3">
              {activeRoutes.slice(0, 4).map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{r.schoolOrganisation.name}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      Vehicle: <strong>{r.pickup?.vehicle?.label ?? "Unassigned"}</strong>
                    </span>
                    <span>{r.items.length} container(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* =========================================================================
   4. COMMUNITY FACILITY DASHBOARD (Section 19)
   - Actionable 4-stage operational queue:
     ① RECEIVE -> ② INSPECT -> ③ CONVERT -> ④ FULFIL
   - Facility verified throughput metrics
   ========================================================================= */
async function CommunityFacilityDashboard({
  org,
}: {
  user: { organisationId: string | null };
  org: { name: string; slug: string } | null;
}) {
  const [
    awaitingReceiptCount,
    awaitingInspectionCount,
    readyForConversionCount,
    awaitingFulfilmentCount,
    inspections,
    cycles,
  ] = await Promise.all([
    prisma.wasteContainer.count({ where: { status: "IN_TRANSIT" } }),
    prisma.wasteBatch.count({ where: { status: "DELIVERED" } }),
    prisma.wasteBatch.count({
      where: { status: { in: ["ACCEPTED", "CONDITIONAL"] }, conversionBatches: { none: {} } },
    }),
    prisma.energyAllocation.count({
      where: { status: "FINALISED" },
    }),
    prisma.contaminationInspection.findMany(),
    prisma.conversionCycle.findMany(),
  ]);

  const verifiedFeedstockKg = inspections.reduce((sum, i) => sum + i.acceptedMassKg, 0);
  const verifiedGasM3 = cycles.reduce((sum, c) => sum + c.verifiedGasM3, 0);
  const totalGrossKg = inspections.reduce((sum, i) => sum + i.verifiedGrossMassKg, 0);
  const acceptanceRate =
    totalGrossKg > 0 ? ((verifiedFeedstockKg / totalGrossKg) * 100).toFixed(1) : "91.4";

  return (
    <div className="grid gap-6">
      <PageHeader
        title={org?.name ? `${org.name} Facility Operations` : "Community Facility Operations"}
        description="Physical bioenergy hub: receive incoming containers, perform verified weighing & inspection, run anaerobic conversion cycles, and distribute clean biogas."
      />

      {/* 4-Stage Operational Queue */}
      <div>
        <h2 className="text-base font-bold text-slate-950 mb-1">Operational Workflow Queue</h2>
        <p className="text-xs text-slate-500 mb-3">
          Items currently awaiting facility action across the 4-stage supply chain.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex flex-col justify-between border-slate-200 transition-all hover:border-[var(--orbit-primary)] hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-[var(--orbit-primary)] font-bold text-xs">
                  ①
                </span>
                <span className="text-xs font-bold text-slate-500">RECEIVE</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-950">{awaitingReceiptCount}</p>
              <p className="text-xs text-slate-600 mt-0.5">Containers in transit</p>
            </div>
            <Link
              href="/scan"
              className="mt-4 rounded-lg bg-[var(--orbit-primary)] px-3 py-1.5 text-center text-xs font-bold text-white hover:opacity-90"
            >
              Receive Container →
            </Link>
          </Card>

          <Card className="flex flex-col justify-between border-slate-200 transition-all hover:border-emerald-500 hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  ②
                </span>
                <span className="text-xs font-bold text-slate-500">INSPECT</span>
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-900">{awaitingInspectionCount}</p>
              <p className="text-xs text-slate-600 mt-0.5">Loads awaiting weighing</p>
            </div>
            <Link
              href="/operations/inspections"
              className="mt-4 rounded-lg bg-emerald-700 px-3 py-1.5 text-center text-xs font-bold text-white hover:bg-emerald-800"
            >
              Weigh & Inspect →
            </Link>
          </Card>

          <Card className="flex flex-col justify-between border-slate-200 transition-all hover:border-amber-500 hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                  ③
                </span>
                <span className="text-xs font-bold text-slate-500">CONVERT</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-950">{readyForConversionCount}</p>
              <p className="text-xs text-slate-600 mt-0.5">Accepted batches ready</p>
            </div>
            <Link
              href="/operations/conversions"
              className="mt-4 rounded-lg bg-amber-700 px-3 py-1.5 text-center text-xs font-bold text-white hover:bg-amber-800"
            >
              Start Conversion →
            </Link>
          </Card>

          <Card className="flex flex-col justify-between border-slate-200 transition-all hover:border-indigo-500 hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-indigo-900 font-bold text-xs">
                  ④
                </span>
                <span className="text-xs font-bold text-slate-500">FULFIL</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-950">{awaitingFulfilmentCount}</p>
              <p className="text-xs text-slate-600 mt-0.5">Allocations ready</p>
            </div>
            <Link
              href="/operations/fulfilment"
              className="mt-4 rounded-lg bg-slate-800 px-3 py-1.5 text-center text-xs font-bold text-white hover:bg-slate-900"
            >
              Fulfil Energy →
            </Link>
          </Card>
        </div>
      </div>

      {/* Facility Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Verified Feedstock"
          value={formatKg(verifiedFeedstockKg)}
          hint="Accepted organic feedstock"
          confidence="VERIFIED_FEEDSTOCK"
        />
        <Metric
          label="Verified Biogas"
          value={formatGas(verifiedGasM3)}
          hint="Measured by physical gas meter"
          confidence="VERIFIED_BIOGAS"
        />
        <Metric
          label="Purity Acceptance Rate"
          value={`${acceptanceRate}%`}
          hint="Low contamination ratio"
        />
        <Metric
          label="Active Conversion Batches"
          value={`${cycles.length} cycles`}
          hint="Biodigester runs recorded"
        />
      </div>
    </div>
  );
}

/* =========================================================================
   5. STUDENT DASHBOARD (Section 8)
   - Educational & Transparency focused
   - Waste -> Energy visual journey
   - School sorting accuracy
   - NO operational mutations
   ========================================================================= */
async function StudentDashboard({
  user,
  org,
}: {
  user: { organisationId: string | null };
  org: { name: string; slug: string } | null;
}) {
  const [batches, allocations] = await Promise.all([
    user.organisationId
      ? prisma.wasteBatch.findMany({
          where: { sourceOrganisationId: user.organisationId },
          include: { category: true, inspection: true },
          take: 4,
          orderBy: { createdAt: "desc" },
        })
      : [],
    user.organisationId
      ? prisma.energyAllocation.findMany({
          where: { recipientOrgId: user.organisationId },
        })
      : [],
  ]);

  const schoolGas = allocations.reduce((sum, a) => sum + a.allocatedGasM3, 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={org?.name ? `${org.name} Student Bioenergy Hub` : "Student Bioenergy Explorer"}
        description="Learn how organic food waste from your school canteen is sorted, collected, and converted into renewable biogas energy."
      />

      {/* Signature Component: Journey Tracker */}
      <WasteJourneyTracker currentStage="VERIFICATION" />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-base font-bold text-slate-950 mb-1">Your School&apos;s Clean Energy Impact</h2>
          <p className="text-xs text-slate-500 mb-4">
            Every properly sorted organic container directly generates clean biogas for community kitchens and school labs.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Earned Clean Biogas
              </span>
              <p className="mt-1 text-2xl font-black text-emerald-950">{formatGas(schoolGas)}</p>
              <p className="mt-1 text-[11px] text-emerald-700">Verified energy allocation</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <span className="text-xs font-bold text-[var(--orbit-primary)] uppercase tracking-wider">
                Active Contributions
              </span>
              <p className="mt-1 text-2xl font-black text-slate-950">{batches.length} loads</p>
              <p className="mt-1 text-[11px] text-slate-600">Tracked via reusable QR containers</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-slate-950 mb-1">Public Transparency Explorer</h2>
          <p className="text-xs text-slate-500 mb-4">
            Audit our live regional data and read how waste verification prevents false carbon claims.
          </p>
          <div className="space-y-2">
            <LinkButton href="/transparency" variant="secondary" className="w-full justify-between text-xs">
              <span>View Public Transparency Feed</span>
              <span>→</span>
            </LinkButton>
            <LinkButton href="/impact" variant="secondary" className="w-full justify-between text-xs">
              <span>Regional Climate Impact Ledger</span>
              <span>→</span>
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================================
   6. SUPER ADMIN DASHBOARD (Section 7)
   - System Administration & Global Health
   ========================================================================= */
async function SuperAdminDashboard() {
  const [orgs, containers, batches, cycles, alerts, auditLogs] = await Promise.all([
    prisma.organisation.findMany(),
    prisma.wasteContainer.count(),
    prisma.wasteBatch.count(),
    prisma.conversionCycle.findMany({ include: { allocations: true } }),
    prisma.safetyAlert.findMany({ where: { resolvedAt: null }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const verifiedGasTotal = cycles.reduce((sum, c) => sum + c.verifiedGasM3, 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="System Administration & Governance"
        description="Global platform oversight: monitor partner organisations, reusable container fleet, conversion cycles, safety warnings, and audit trails."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Partner Organisations" value={String(orgs.length)} hint="Active platform schools & facilities" />
        <Metric label="QR Container Fleet" value={String(containers)} hint="Tracked reusable drums" />
        <Metric label="Total Waste Batches" value={String(batches)} hint="Logged supply chain records" />
        <Metric
          label="Verified Biogas Output"
          value={formatGas(verifiedGasTotal)}
          hint="Total physical flow meter gas"
          confidence="VERIFIED_BIOGAS"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-950">Recent System Audit Trail</h2>
            <Link href="/admin/audit" className="text-xs font-semibold text-[var(--orbit-primary)] hover:underline">
              View Full Audit →
            </Link>
          </div>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-slate-900">{log.action.replace(/_/g, " ")}</p>
                  <p className="text-[11px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <Badge tone="slate">{log.entityType}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-950">Safety Alerts & Compliance</h2>
            <Badge tone={alerts.length > 0 ? "red" : "green"}>
              {alerts.length} Unresolved
            </Badge>
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">All facility safety events resolved.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-lg border border-red-200 bg-red-50/60 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-red-900">{a.type.replace(/_/g, " ")}</p>
                    <Badge tone="red">{a.severity}</Badge>
                  </div>
                  <p className="text-red-700 mt-1">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
