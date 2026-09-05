import { env } from "@/lib/env";
import { QrLabel } from "@/components/qr-label";
import { AlertBanner, Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg, humanise } from "@/lib/utils";
import { ArrowLeft, CalendarCheck, Recycle } from "lucide-react";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const batch = await prisma.wasteBatch.findUniqueOrThrow({
    where: { id },
    include: {
      category: true,
      source: true,
      sourceOrganisation: true,
      responsibleUser: true,
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

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        {user.role === "CANTEEN_STAFF" ? (
          <LinkButton href="/canteen/dashboard" variant="ghost" className="text-xs text-slate-500 hover:text-slate-900">
            <ArrowLeft size={14} /> Back to Canteen Dashboard
          </LinkButton>
        ) : user.role === "SCHOOL_ADMIN" ? (
          <LinkButton href="/school/dashboard" variant="ghost" className="text-xs text-slate-500 hover:text-slate-900">
            <ArrowLeft size={14} /> Back to School Collection
          </LinkButton>
        ) : (
          <LinkButton href="/batches" variant="ghost" className="text-xs text-slate-500 hover:text-slate-900">
            <ArrowLeft size={14} /> Back to All Batches
          </LinkButton>
        )}
      </div>

      <PageHeader
        title={batch.batchCode}
        description="Private operational detail with status history, inspection evidence, pickup data, and printable trace label."
        action={
          <div className="flex flex-wrap gap-2">
            {user.role === "CANTEEN_STAFF" ? (
              <LinkButton href="/batches/new">
                <Recycle size={16} /> Register Another Container
              </LinkButton>
            ) : user.role === "SCHOOL_ADMIN" && batch.status === "READY_FOR_PICKUP" && !batch.pickupRequestItem ? (
              <LinkButton href="/operations/pickups">
                <CalendarCheck size={16} /> Request Pickup
              </LinkButton>
            ) : null}
            <LinkButton href={`/trace/${batch.qrToken}`} variant="secondary">
              Safe Trace Page
            </LinkButton>
          </div>
        }
      />

      {batch.status === "READY_FOR_PICKUP" ? (
        <AlertBanner tone="success" title="Container Marked Ready for Collection">
          This organic load is sealed and stored at the school sorting bay. Official weighing will be conducted upon delivery to the community processing facility. Your School Administrator can now bundle this container into a collection pickup request.
        </AlertBanner>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Lifecycle Status</p>
                <Badge tone={batch.status === "REJECTED" ? "red" : batch.status === "CONDITIONAL" ? "amber" : "green"}>
                  {humanise(batch.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Source Organisation</p>
                <p className="font-bold">{batch.sourceOrganisation.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Feedstock Category</p>
                <p className="font-bold">{batch.category.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Storage Bay</p>
                <p className="font-bold text-xs truncate">{batch.storageStatus}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Measurement & Data Integrity</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">1. At Source (Canteen)</p>
                    <Badge tone="slate">Unverified</Badge>
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {batch.declaredMassKg ? `${batch.declaredMassKg} kg` : "No weight entered"}
                  </p>
                  <p className="text-[11px] text-slate-500">Container marked ready; official weighing deferred to facility</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">2. At Facility (Community)</p>
                    <Badge tone={inspection ? "green" : "amber"}>{inspection ? "Measured" : "Pending"}</Badge>
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {inspection ? formatKg(inspection.verifiedGrossMassKg) : "Pending verification"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {inspection
                      ? `Accepted: ${formatKg(inspection.acceptedMassKg)} (${inspection.contaminationRate}% rejected)`
                      : "Weighed on physical calibrated scales upon delivery"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">3. Energy Conversion</p>
                    <Badge tone={batch.conversionBatches.length > 0 ? "green" : "slate"}>
                      {batch.conversionBatches.length > 0 ? "Verified Gas" : "Estimated"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {batch.conversionBatches[0]?.cycle.verifiedGasM3
                      ? formatGas(batch.conversionBatches[0].cycle.verifiedGasM3)
                      : inspection
                        ? `${(inspection.acceptedMassKg * batch.category.yieldFactor).toFixed(2)} m³ (Est.)`
                        : "Pending conversion"}
                  </p>
                  <p className="text-[11px] text-slate-500">Actual biogas measured at biodigester flow meter</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Community Facility Inspection</h2>
            {inspection ? (
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Decision</p>
                  <Badge tone={inspection.decision === "REJECTED" ? "red" : inspection.decision === "CONDITIONAL" ? "amber" : "green"}>
                    {inspection.decision}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Verified Gross Mass</p>
                  <p className="font-bold">{formatKg(inspection.verifiedGrossMassKg)} <span className="text-xs text-green-700 font-normal">(Measured)</span></p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Accepted Organics</p>
                  <p className="font-bold">{formatKg(inspection.acceptedMassKg)} <span className="text-xs text-slate-500 font-normal">(Calculated)</span></p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Contamination Rate</p>
                  <p className="font-bold">{inspection.contaminationRate}% <span className="text-xs text-slate-500 font-normal">({formatKg(inspection.rejectedMassKg)} rejected)</span></p>
                </div>
                <p className="md:col-span-4 text-sm leading-6 text-slate-600">{inspection.notes}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No community facility inspection yet. Waste batch awaiting delivery and verified weighing.</p>
            )}
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Activity timeline</h2>
            <ol className="mt-4 grid gap-3">
              {timeline.map((item, index) => {
                const entry = item as { status?: string; at?: string; actor?: string };
                return (
                  <li key={`${entry.status}-${index}`} className="rounded-md border border-slate-200 p-3">
                    <p className="font-semibold">{entry.status ? humanise(entry.status) : "Activity"}</p>
                    <p className="text-sm text-slate-500">
                      {entry.at} by {entry.actor ?? "ORBIT"}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
        <QrLabel value={traceUrl} batchCode={batch.batchCode} />
      </div>
    </div>
  );
}
