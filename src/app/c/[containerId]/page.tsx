import { auth } from "@/auth";
import { ConfidenceBadge } from "@/components/public/confidence";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Button, Card, LinkButton } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatGas, formatKg, humanise } from "@/lib/utils";
import { ContainerQrTag } from "@/components/container-qr-tag";
import { JourneyTimeline } from "@/components/journey-timeline";
import { PhotoUpload } from "@/components/photo-upload";
import { createBatchFromContainerFormAction } from "@/app/actions";

export default async function ContainerAdaptivePage({
  params,
  searchParams,
}: {
  params: Promise<{ containerId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { containerId } = await params;
  const { submitted } = await searchParams;

  // Resolve container by qrToken first, or fallback to containerCode or id
  const container = await prisma.wasteContainer.findFirst({
    where: {
      OR: [
        { qrToken: containerId },
        { containerCode: containerId },
        { id: containerId },
      ],
    },
    include: {
      organisation: true,
      source: true,
      category: true,
      batches: {
        orderBy: { createdAt: "desc" },
        include: {
          inspection: true,
          contributionScores: true,
          conversionBatches: {
            include: {
              cycle: {
                include: {
                  allocations: {
                    include: { fulfilments: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const session = await auth();
  const user = session?.user;

  if (!container) {
    return (
      <>
        <PublicHeader />
        <main id="main" className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
          <Card className="max-w-md p-8">
            <span className="text-4xl">⚠️</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Container Tag Not Found</h1>
            <p className="mt-2 text-sm text-slate-600">
              The QR token <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">{containerId}</code> is not registered in the ORBIT system.
            </p>
            <LinkButton href="/transparency" variant="secondary" className="mt-6">
              Return to Transparency Dashboard
            </LinkButton>
          </Card>
        </main>
        <PublicFooter />
      </>
    );
  }

  // 1 Active Batch Invariant Check
  const activeBatch = container.batches.find(
    (b) => !["PROCESSED", "CLOSED", "REJECTED"].includes(b.status)
  );

  const isRevoked = !container.isActive || container.status === "REVOKED";
  const isUserOrgMember = user && (user.organisationId === container.organisationId || user.role === "SUPER_ADMIN");
  const canSubmitBatch = Boolean(
    user && isUserOrgMember && (user.role === "CANTEEN_STAFF" || user.role === "SUPER_ADMIN") && !isRevoked && !activeBatch
  );

  const batchesCount = container.batches.length;
  const totalAcceptedKg = container.batches.reduce(
    (sum, b) => sum + (b.acceptedMassKg ?? b.inspection?.acceptedMassKg ?? 0),
    0
  );
  const totalDeclaredKg = container.batches.reduce(
    (sum, b) => sum + (b.declaredMassKg ?? b.grossWeightKg ?? 0),
    0
  );
  const totalVerifiedGasM3 = container.batches.reduce(
    (sum, b) => sum + (b.conversionBatches[0]?.cycle.verifiedGasM3 ?? 0),
    0
  );
  const totalEstimatedGasM3 = container.batches.reduce(
    (sum, b) => sum + (b.contributionScores[0]?.estimatedGasM3 ?? 0),
    0
  );

  const latestBatch = container.batches[0];
  const activeTimeline = Array.isArray(activeBatch?.activityTimeline)
    ? (activeBatch.activityTimeline as Array<{ status: string; at: string; actor?: string; notes?: string }>)
    : [];

  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto grid min-h-[70vh] max-w-4xl gap-8 px-4 py-10">
        {/* Banner Alert if Submitted */}
        {submitted ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
            <div className="flex items-center gap-2 font-bold">
              <span>✅</span> Batch Successfully Created & Registered
            </div>
            <p className="mt-1">
              Container status updated to <strong className="font-bold">READY_FOR_PICKUP</strong>. Operator pickup schedule notification has been dispatched.
            </p>
          </div>
        ) : null}

        {/* Revoked Notice */}
        {isRevoked ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 shadow-sm">
            <div className="flex items-center gap-2 font-bold">
              <span>🛑</span> This Reusable Container is Inactive or Revoked
            </div>
            <p className="mt-1">
              New batch registrations are disabled for this container. Historical traceability data remains preserved for audit compliance.
            </p>
          </div>
        ) : null}

        {/* Public Header Card */}
        <Card className="overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--orbit-primary)]">
                  ORBIT REUSABLE CONTAINER
                </span>
                <Badge tone={isRevoked ? "red" : activeBatch ? "amber" : "green"}>
                  {humanise(container.status)}
                </Badge>
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {container.containerCode}
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Origin: <span className="text-slate-900">{container.organisation.name}</span> — {container.source.name}
              </p>
            </div>
            <ConfidenceBadge value="Measured" />
          </div>

          {/* Quick Metrics Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Feedstock Type</p>
              <p className="mt-1 text-base font-bold text-slate-900">{container.category.name}</p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Processed Cycles</p>
              <p className="mt-1 text-base font-bold text-slate-900">{batchesCount} Batches</p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Accepted / Declared</p>
              <p className="mt-1 text-base font-bold text-emerald-700">
                {formatKg(totalAcceptedKg)} <span className="text-xs font-normal text-slate-500">({formatKg(totalDeclaredKg)} total)</span>
              </p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Verified Bioenergy</p>
              <p className="mt-1 text-base font-bold text-emerald-700">
                {totalVerifiedGasM3 > 0 ? formatGas(totalVerifiedGasM3) : `${formatGas(totalEstimatedGasM3)} (est)`}
              </p>
            </div>
          </div>
        </Card>

        {/* ACTIVE BATCH NOTICE CARD (Invariance Enforcement) */}
        {activeBatch ? (
          <Card className="border-2 border-amber-400 bg-amber-50/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-900">
                  ⏳ Active Collection Cycle in Progress
                </span>
                <h2 className="text-xl font-bold text-slate-950">Batch #{activeBatch.batchCode}</h2>
              </div>
              <Badge tone="amber">{humanise(activeBatch.status)}</Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-800">
              <div>
                <span className="text-xs text-slate-500">Declared Weight:</span>
                <p className="font-bold">{formatKg(activeBatch.declaredMassKg ?? activeBatch.grossWeightKg)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Pickup Status:</span>
                <p className="font-bold">{humanise(activeBatch.pickupStatus)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Inspection Decision:</span>
                <p className="font-bold">
                  {activeBatch.inspection ? humanise(activeBatch.inspection.decision) : "Pending Facility Receipt"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-amber-900 italic">
              ℹ️ A new batch cannot be created until the operator completes inspection and empties this container at the facility.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <LinkButton href={`/batches/${activeBatch.id}`} variant="primary">
                🔍 View Active Batch Details
              </LinkButton>
            </div>
          </Card>
        ) : null}

        {/* ROLE ADAPTIVE WORKFLOW SECTION */}
        {user ? (
          <Card className="border-2 border-[var(--orbit-primary)]/20 p-6 bg-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                ⚡ Authenticated Action Panel ({user.role})
              </h2>
              <span className="text-xs font-medium text-slate-500">{user.email}</span>
            </div>

            {/* CANTEEN_STAFF / SUPPORTING_CONTRIBUTOR Form */}
            {canSubmitBatch ? (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Register New Waste Batch for {container.containerCode}
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Fill up this reusable container and submit declared mass for operator collection.
                </p>
                <form action={createBatchFromContainerFormAction} className="mt-4 grid gap-4 rounded-lg bg-white p-4 border border-slate-200">
                  <input type="hidden" name="containerId" value={container.id} />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm font-medium text-slate-800">
                      Declared Waste Weight (kg) *
                      <input
                        type="number"
                        name="declaredMassKg"
                        step="0.1"
                        min="0.5"
                        max="500"
                        required
                        placeholder="e.g. 18.5"
                        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
                      />
                    </label>
                    
                    <label className="grid gap-1 text-sm font-medium text-slate-800">
                      Audit Photo (Optional)
                      <PhotoUpload name="photoUrl" />
                    </label>
                  </div>

                  <label className="grid gap-1 text-sm font-medium text-slate-800">
                    Notes / Sorting Condition (Optional)
                    <input
                      type="text"
                      name="notes"
                      placeholder="e.g. Clean canteen food scraps, pre-sorted"
                      className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
                    />
                  </label>

                  <Button type="submit" variant="primary" className="mt-2">
                    🚀 Submit Batch & Request Pickup
                  </Button>
                </form>
              </div>
            ) : null}

            {/* OPERATOR Actions */}
            {user.role === "OPERATOR" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <LinkButton href="/operations/pickups" variant="primary">
                  📋 View Pickup Schedule
                </LinkButton>
                {latestBatch ? (
                  <LinkButton href={`/batches/${latestBatch.id}`} variant="secondary">
                    🔍 Inspect Batch ({latestBatch.batchCode})
                  </LinkButton>
                ) : null}
              </div>
            ) : null}

            {/* SUPER_ADMIN Controls */}
            {user.role === "SUPER_ADMIN" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <LinkButton href="/admin/containers" variant="secondary">
                  ⚙️ Super Admin Container Management
                </LinkButton>
                <LinkButton href={`/c/${container.qrToken}`} variant="ghost">
                  🔄 Refresh View
                </LinkButton>
              </div>
            ) : null}
          </Card>
        ) : (
          /* UNAUTHENTICATED PUBLIC VIEW NOTICE */
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              🔒 Public-Safe View Mode
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              You are scanning in public transparency mode. Operational controls are protected by server-side role authorization. Canteen staff or operators must sign in to initiate pickup requests or inspections.
            </p>
            <LinkButton href="/login" variant="secondary" className="mt-3 text-xs">
              Log In for Operational Access
            </LinkButton>
          </div>
        )}

        {/* Active Journey Timeline if Batch Active */}
        {activeBatch && activeTimeline.length > 0 ? (
          <JourneyTimeline
            timeline={activeTimeline}
            batchCode={activeBatch.batchCode}
            currentStatus={activeBatch.status}
          />
        ) : null}

        {/* Container QR Tag Card */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-950">Container Digital Identity Tag</h2>
          <ContainerQrTag
            containerCode={container.containerCode}
            qrToken={container.qrToken}
            orgName={container.organisation.name}
            sourceName={container.source.name}
            categoryName={container.category.name}
            capacityKg={container.capacityKg}
          />
        </Card>

        {/* Chain of Custody Log */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Chain of Custody History</h2>
          <p className="mt-1 text-xs text-slate-500">
            Historical batch log associated with this physical container.
          </p>

          {container.batches.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="p-3">Batch Code</th>
                    <th className="p-3">Declared</th>
                    <th className="p-3">Accepted Mass</th>
                    <th className="p-3">Quality</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {container.batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{b.batchCode}</td>
                      <td className="p-3">{formatKg(b.declaredMassKg ?? b.grossWeightKg)}</td>
                      <td className="p-3 font-bold text-emerald-700">
                        {b.inspection ? formatKg(b.inspection.acceptedMassKg) : "Pending"}
                      </td>
                      <td className="p-3">
                        {b.inspection ? `${(100 - b.inspection.contaminationRate).toFixed(0)}% clean` : "Pending"}
                      </td>
                      <td className="p-3">
                        <Badge tone={b.status === "REJECTED" ? "red" : "green"}>{humanise(b.status)}</Badge>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 italic">
              No waste batches recorded for this container yet.
            </p>
          )}
        </Card>

        {/* Refined Positioning & Principle Statement */}
        <Card className="bg-emerald-950 p-6 text-white">
          <h2 className="text-xl font-black text-emerald-300">
            🛡️ No Verified Source Identity = No Source-Specific Energy Allocation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-100">
            ORBIT connects physical reusable containers with digital bioenergy accounting. Un-tagged waste received at TPS3R can still be processed, but only official QR containers allow clean organic contributions to be reliably attributed and credited back to participating schools and communities.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href="/transparency" variant="secondary">
              Explore Live Transparency Dashboard
            </LinkButton>
            <LinkButton href="/methodology" variant="ghost" className="text-emerald-300 hover:text-white">
              Read Purity-to-Power Methodology →
            </LinkButton>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
