import { Badge, Card, LinkButton } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatKg, humanise } from "@/lib/utils";

export default async function TracePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const batch =
    token === "demo"
      ? await prisma.wasteBatch.findFirst({ include: { category: true, inspection: true, conversionBatches: { include: { cycle: true } } } })
      : await prisma.wasteBatch.findUnique({
          where: { qrToken: token },
          include: { category: true, inspection: true, conversionBatches: { include: { cycle: true } } },
        });
  return (
    <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-4 py-10">
      <Card className="w-full">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Safe ORBIT Trace</p>
        {batch ? (
          <>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{batch.batchCode}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This public page intentionally excludes private user, facility, and internal database information.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div><p className="text-sm text-slate-500">Status</p><Badge tone={batch.status === "REJECTED" ? "red" : "green"}>{humanise(batch.status)}</Badge></div>
              <div><p className="text-sm text-slate-500">Feedstock</p><p className="font-bold">{batch.category.name}</p></div>
              <div><p className="text-sm text-slate-500">Registered gross</p><p className="font-bold">{formatKg(batch.grossWeightKg)}</p></div>
              <div><p className="text-sm text-slate-500">Accepted mass</p><p className="font-bold">{batch.inspection ? formatKg(batch.inspection.acceptedMassKg) : "Pending validation"}</p></div>
            </div>
            <div className="mt-5 rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Estimated gas is not displayed as measured output. Verified gas appears only after an operator conversion record exists.
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Trace not found</h1>
            <p className="mt-2 text-sm text-slate-600">The QR identifier is unknown or no longer valid.</p>
          </>
        )}
        <LinkButton href="/" variant="secondary" className="mt-6">Back to ORBIT</LinkButton>
      </Card>
    </main>
  );
}
