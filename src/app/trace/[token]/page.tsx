import { ConfidenceBadge } from "@/components/public/confidence";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Card, LinkButton } from "@/components/ui";
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
  const score = batch?.contributionScores[0];
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
      <main id="main" className="mx-auto grid min-h-[70vh] max-w-4xl px-4 py-10">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--orbit-primary)]">Safe ORBIT Trace</p>
              {batch ? <h1 className="mt-2 text-4xl font-bold text-slate-950">{batch.batchCode}</h1> : null}
            </div>
            <ConfidenceBadge value="Simulated Demo" />
          </div>
          {batch ? (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Public trace excludes personal names, email addresses, private photos, exact routes,
                vehicle identifiers, raw safety details, and private audit diffs.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div><p className="text-sm text-slate-500">Source organisation</p><p className="font-bold">{batch.sourceOrganisation.name}</p></div>
                <div><p className="text-sm text-slate-500">Status</p><Badge tone={batch.status === "REJECTED" ? "red" : "green"}>{humanise(batch.status)}</Badge></div>
                <div><p className="text-sm text-slate-500">Feedstock</p><p className="font-bold">{batch.category.name}</p></div>
                <div><p className="text-sm text-slate-500">Gross mass</p><p className="font-bold">{formatKg(batch.grossWeightKg)}</p></div>
                <div><p className="text-sm text-slate-500">Accepted mass</p><p className="font-bold">{batch.inspection ? formatKg(batch.inspection.acceptedMassKg) : "Pending validation"}</p></div>
                <div><p className="text-sm text-slate-500">Contamination</p><p className="font-bold">{batch.inspection ? `${batch.inspection.contaminationRate}%` : "Pending"}</p></div>
                <div><p className="text-sm text-slate-500">Estimated contribution</p><p className="font-bold">{score ? score.contributionScore.toFixed(4) : "Pending"}</p></div>
                <div><p className="text-sm text-slate-500">Conversion cycle</p><p className="font-bold">{cycle?.cycleCode ?? "Not processed"}</p></div>
                <div><p className="text-sm text-slate-500">Verified gas in cycle</p><p className="font-bold">{cycle ? formatGas(cycle.verifiedGasM3) : "Pending"}</p></div>
                <div><p className="text-sm text-slate-500">Allocation status</p><p className="font-bold">{allocated ? formatGas(allocated) : "Pending"}</p></div>
                <div><p className="text-sm text-slate-500">Fulfilment status</p><p className="font-bold">{fulfilled ? `${formatGas(fulfilled)} fulfilled` : "Not delivered yet"}</p></div>
                <div><p className="text-sm text-slate-500">Data classification</p><p className="font-bold">Public-safe aggregate trace</p></div>
              </div>
              <div className="mt-6 rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Estimated gas is not presented as measured output. Verified gas appears only after an operator conversion record exists.
              </div>
              <h2 className="mt-8 text-lg font-bold">Public timeline</h2>
              <ol className="mt-3 grid gap-3">
                {timeline.map((item, index) => {
                  const entry = item as { status?: string; at?: string };
                  return (
                    <li key={`${entry.status}-${index}`} className="rounded-md border border-slate-200 p-3">
                      <p className="font-semibold">{entry.status ? humanise(entry.status) : "Activity"}</p>
                      <p className="text-sm text-slate-500">{entry.at ?? "Timestamp pending"}</p>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Trace not found</h1>
              <p className="mt-2 text-sm text-slate-600">The QR identifier is unknown or no longer valid.</p>
            </>
          )}
          <LinkButton href="/transparency" variant="secondary" className="mt-6">Open transparency dashboard</LinkButton>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
