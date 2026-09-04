import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Card, DataConfidenceBadge, LinkButton, StatusBadge } from "@/components/ui";
import { WasteJourneyTracker } from "@/components/waste-journey-tracker";
import { prisma } from "@/lib/db";
import { formatGas, formatKg, humanise } from "@/lib/utils";

export default async function TracePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const include = {
    category: true,
    sourceOrganisation: true,
    inspection: true,
    contributionScores: true,
    conversionBatches: {
      include: {
        cycle: { include: { allocations: { include: { fulfilments: true } } } },
      },
    },
  };

  const batch =
    token === "demo"
      ? await prisma.wasteBatch.findFirst({ include })
      : await prisma.wasteBatch.findUnique({ where: { qrToken: token }, include });

  const timeline = Array.isArray(batch?.activityTimeline) ? batch.activityTimeline : [];
  const cycle = batch?.conversionBatches[0]?.cycle;
  const allocated = cycle?.allocations.reduce((sum, allocation) => sum + allocation.allocatedGasM3, 0) ?? 0;
  const fulfilled =
    cycle?.allocations.reduce(
      (sum, allocation) =>
        sum + allocation.fulfilments.reduce((inner, item) => inner + item.volumeM3, 0),
      0,
    ) ?? 0;

  return (
    <>
      <PublicHeader />
      <main id="main" className="orbit-container py-10 space-y-6">
        {batch ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--orbit-primary)]">
                  SAFE PUBLIC SUPPLY CHAIN TRACE
                </span>
                <h1 className="mt-1 text-3xl sm:text-4xl font-black text-slate-950">
                  Batch {batch.batchCode}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
                  Public trace aggregate for community auditability. Personal identifiers, driver routes, and private facility operations are omitted.
                </p>
              </div>
              <DataConfidenceBadge
                level={cycle ? "VERIFIED_BIOGAS" : batch.inspection ? "MEASURED" : "UNVERIFIED"}
              />
            </div>

            {/* Signature Waste to Energy Journey Component */}
            <WasteJourneyTracker
              currentStage={batch.status}
              batchCode={batch.batchCode}
              metrics={{
                declaredKg: batch.declaredMassKg,
                verifiedGrossKg: batch.inspection?.verifiedGrossMassKg,
                acceptedMassKg: batch.inspection?.acceptedMassKg,
                estimatedGasM3: batch.inspection ? batch.inspection.acceptedMassKg * batch.category.yieldFactor : null,
                verifiedGasM3: cycle?.verifiedGasM3,
              }}
            />

            <div className="grid gap-6 md:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <Card>
                  <h2 className="text-base font-bold text-slate-950 mb-4 border-b border-slate-100 pb-2.5">
                    Supply Chain Evidence & Metrics
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-3 text-xs">
                    <div>
                      <p className="text-slate-500">Source Contributor</p>
                      <p className="font-bold text-slate-900 mt-0.5">{batch.sourceOrganisation.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Lifecycle Status</p>
                      <div className="mt-0.5"><StatusBadge status={batch.status} /></div>
                    </div>
                    <div>
                      <p className="text-slate-500">Feedstock Type</p>
                      <p className="font-bold text-slate-900 mt-0.5">{batch.category.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Verified Gross Mass</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatKg(batch.grossWeightKg)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Accepted Organics</p>
                      <p className="font-bold text-emerald-800 mt-0.5">
                        {batch.inspection ? formatKg(batch.inspection.acceptedMassKg) : "Pending weighing"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Contamination Rate</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {batch.inspection ? `${batch.inspection.contaminationRate}%` : "Pending inspection"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Verified Biogas Output</p>
                      <p className="font-bold text-[var(--orbit-primary)] mt-0.5">
                        {cycle ? formatGas(cycle.verifiedGasM3) : "Pending conversion"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Allocated Credit</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatGas(allocated)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fulfilled Energy</p>
                      <p className="font-bold text-emerald-800 mt-0.5">
                        {fulfilled > 0 ? formatGas(fulfilled) : "Awaiting distribution"}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Public Activity Timeline */}
                <Card>
                  <h2 className="text-base font-bold text-slate-950 mb-3 border-b border-slate-100 pb-2.5">
                    Verified Public Timeline
                  </h2>
                  <ol className="space-y-3">
                    {timeline.map((item, index) => {
                      const entry = item as { status?: string; at?: string };
                      return (
                        <li key={`${entry.status}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {entry.status ? humanise(entry.status) : "Supply Chain Checkpoint"}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {entry.at ? new Date(entry.at).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recorded"}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                <Card>
                  <h3 className="text-sm font-bold text-slate-950">Data Trust Architecture</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    ORBIT enforces strict mathematical distinction between theoretical estimates and physically measured gas yields.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <LinkButton href="/transparency" variant="secondary" className="w-full text-xs">
                      Transparency Dashboard
                    </LinkButton>
                    <LinkButton href="/partners" variant="secondary" className="w-full text-xs">
                      Partner Directory
                    </LinkButton>
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <Card className="max-w-md mx-auto text-center p-8">
            <h1 className="text-2xl font-bold text-slate-950">Trace Not Found</h1>
            <p className="mt-2 text-xs text-slate-600">
              The requested QR code or batch identifier does not match an active public record.
            </p>
            <div className="mt-6">
              <LinkButton href="/transparency">Open Transparency Feed</LinkButton>
            </div>
          </Card>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
