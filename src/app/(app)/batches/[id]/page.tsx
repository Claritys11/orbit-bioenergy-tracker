import { env } from "@/lib/env";
import { QrLabel } from "@/components/qr-label";
import { Badge, Card, DataConfidenceBadge, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { WasteJourneyTracker } from "@/components/waste-journey-tracker";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg, humanise } from "@/lib/utils";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const batch = await prisma.wasteBatch.findUniqueOrThrow({
    where: { id },
    include: {
      category: true,
      source: true,
      sourceOrganisation: true,
      responsibleUser: true,
      container: true,
      inspection: true,
      pickupRequestItem: {
        include: {
          pickupRequest: {
            include: { pickup: true },
          },
        },
      },
      photos: true,
      conversionBatches: { include: { cycle: true } },
    },
  });

  const timeline = Array.isArray(batch.activityTimeline) ? batch.activityTimeline : [];
  const traceUrl = `${env.NEXT_PUBLIC_APP_URL}/trace/${batch.qrToken}`;
  const inspection = batch.inspection;
  const cycle = batch.conversionBatches[0]?.cycle;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={batch.batchCode}
        description="Audit detail: source registration, logistics chain of custody, facility inspection, verified gas conversion, and public QR identity."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Waste Batches", href: "/batches" },
          { label: batch.batchCode },
        ]}
        action={
          <LinkButton href={`/trace/${batch.qrToken}`} variant="secondary" className="text-xs">
            Open Public Trace →
          </LinkButton>
        }
      />

      {/* Signature Component: Journey Tracker */}
      <WasteJourneyTracker
        currentStage={batch.status}
        batchCode={batch.batchCode}
        metrics={{
          declaredKg: batch.declaredMassKg,
          verifiedGrossKg: inspection?.verifiedGrossMassKg,
          acceptedMassKg: inspection?.acceptedMassKg,
          estimatedGasM3: inspection ? inspection.acceptedMassKg * batch.category.yieldFactor : null,
          verifiedGasM3: cycle?.verifiedGasM3,
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-950">Batch Metadata</h2>
              <StatusBadge status={batch.status} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Source Organisation</p>
                <p className="font-bold text-slate-900 mt-0.5">{batch.sourceOrganisation.name}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Assigned Drum</p>
                <p className="font-bold text-[var(--orbit-primary)] mt-0.5">
                  {batch.container?.containerCode ?? "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Feedstock Category</p>
                <p className="font-bold text-slate-900 mt-0.5">{batch.category.name}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Canteen Bay</p>
                <p className="font-bold text-slate-900 mt-0.5 truncate">{batch.source.name}</p>
              </div>
            </div>

            {/* Step-by-Step Data Confidence Ledger */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Certified Measurement & Integrity Chain
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">1. At Source (Canteen)</p>
                    <DataConfidenceBadge level="UNVERIFIED" className="text-[9px] py-0 px-1.5" />
                  </div>
                  <p className="mt-2 text-lg font-extrabold text-slate-800">
                    {batch.declaredMassKg ? `${batch.declaredMassKg} kg` : "Pending measurement"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Marked ready in drum; official weighing performed at facility scale.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">2. Facility Receiving</p>
                    <DataConfidenceBadge
                      level={inspection ? "MEASURED" : "Pending Field Validation"}
                      className="text-[9px] py-0 px-1.5"
                    />
                  </div>
                  <p className="mt-2 text-lg font-extrabold text-emerald-900">
                    {inspection ? formatKg(inspection.verifiedGrossMassKg) : "Pending verification"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {inspection
                      ? `Accepted: ${formatKg(inspection.acceptedMassKg)} (${inspection.contaminationRate}% rejected)`
                      : "Weighed on calibrated physical scales upon delivery."}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">3. Energy Conversion</p>
                    <DataConfidenceBadge
                      level={cycle ? "VERIFIED_BIOGAS" : "ESTIMATED"}
                      className="text-[9px] py-0 px-1.5"
                    />
                  </div>
                  <p className="mt-2 text-lg font-extrabold text-[var(--orbit-primary)]">
                    {cycle
                      ? formatGas(cycle.verifiedGasM3)
                      : inspection
                      ? `${(inspection.acceptedMassKg * batch.category.yieldFactor).toFixed(2)} m³ (Est.)`
                      : "Pending conversion"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {cycle ? `Logged via Cycle ${cycle.cycleCode}` : "Theoretical yield model until physical gas meter verification."}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Inspection Report */}
          <Card>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-950">Community Facility Inspection Evidence</h2>
              {inspection ? (
                <StatusBadge status={inspection.decision} />
              ) : (
                <Badge tone="slate">Pending Inspection</Badge>
              )}
            </div>

            {inspection ? (
              <div className="grid gap-4 sm:grid-cols-4 text-xs">
                <div>
                  <p className="text-slate-500">Verified Gross</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatKg(inspection.verifiedGrossMassKg)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Accepted Organics</p>
                  <p className="text-base font-extrabold text-emerald-800 mt-0.5">
                    {formatKg(inspection.acceptedMassKg)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Rejected Contaminants</p>
                  <p className="text-base font-extrabold text-red-800 mt-0.5">
                    {formatKg(inspection.rejectedMassKg)} ({inspection.contaminationRate}%)
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Inspected At</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {new Date(inspection.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {inspection.notes ? (
                  <p className="sm:col-span-4 rounded-lg bg-slate-50 p-3 text-slate-700 italic border border-slate-100">
                    &ldquo;{inspection.notes}&rdquo;
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">
                No facility inspection completed yet. Load is awaiting delivery and physical scale calibration.
              </p>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card>
            <h2 className="text-base font-bold text-slate-950 mb-3 border-b border-slate-100 pb-3">
              Activity & Chain of Custody Timeline
            </h2>
            <ol className="space-y-3">
              {timeline.map((item, index) => {
                const entry = item as { status?: string; at?: string; actor?: string };
                return (
                  <li key={`${entry.status}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {entry.status ? humanise(entry.status) : "Supply Chain Event"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {entry.at ? new Date(entry.at).toLocaleString() : "Timestamp pending"}
                      </span>
                    </div>
                    {entry.actor ? (
                      <p className="text-slate-600 mt-0.5 text-[11px]">Actor: {entry.actor}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        {/* Printable QR Identity Card */}
        <div className="space-y-4">
          <QrLabel value={traceUrl} batchCode={batch.batchCode} />
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-xs space-y-2">
            <span className="font-bold text-slate-900 block">QR Trace Integrity</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              This QR links directly to the public-safe aggregate trace page. It does not disclose private vehicle routes or student names.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
