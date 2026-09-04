import { env } from "@/lib/env";
import { QrLabel } from "@/components/qr-label";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatKg, humanise } from "@/lib/utils";

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
      <PageHeader
        title={batch.batchCode}
        description="Private operational detail with status history, inspection evidence, pickup data, and printable trace label."
        action={
          <LinkButton href={`/trace/${batch.qrToken}`} variant="secondary">
            Safe trace page
          </LinkButton>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge tone={batch.status === "REJECTED" ? "red" : "green"}>{humanise(batch.status)}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Gross weight</p>
                <p className="font-bold">{formatKg(batch.grossWeightKg)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Source</p>
                <p className="font-bold">{batch.sourceOrganisation.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Category</p>
                <p className="font-bold">{batch.category.name}</p>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Inspection</h2>
            {inspection ? (
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Decision</p>
                  <Badge tone={inspection.decision === "REJECTED" ? "red" : inspection.decision === "CONDITIONAL" ? "amber" : "green"}>
                    {inspection.decision}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Accepted mass</p>
                  <p className="font-bold">{formatKg(inspection.acceptedMassKg)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Rejected mass</p>
                  <p className="font-bold">{formatKg(inspection.rejectedMassKg)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Contamination</p>
                  <p className="font-bold">{inspection.contaminationRate}%</p>
                </div>
                <p className="md:col-span-4 text-sm leading-6 text-slate-600">{inspection.notes}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No operator inspection yet.</p>
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
