import Link from "next/link";
import { ConversionForm } from "@/components/conversion-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas } from "@/lib/utils";

export default async function ConversionsPage() {
  const user = await requireUser("record_conversion");
  const [facilities, batches, cycles] = await Promise.all([
    user.role === "SUPER_ADMIN"
      ? prisma.partnerFacility.findMany({ include: { organisation: true } })
      : prisma.partnerFacility.findMany({
          where: { organisationId: user.organisationId },
          include: { organisation: true },
        }),
    prisma.wasteBatch.findMany({
      where: { status: { in: ["ACCEPTED", "CONDITIONAL"] } },
      include: { inspection: true, sourceOrganisation: true, category: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.conversionCycle.findMany({
      include: {
        facility: { include: { organisation: true } },
        allocations: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formattedBatches = batches.map((b) => ({
    id: b.id,
    batchCode: b.batchCode,
    sourceOrganisationName: b.sourceOrganisation.name,
    acceptedMassKg: b.inspection?.acceptedMassKg ?? 0,
    yieldFactor: b.category.yieldFactor,
  }));

  const formattedFacilities = facilities.map((f) => ({
    id: f.id,
    name: f.organisation.name,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Biodigester Conversion Cycles"
        description="Record verified organic feedstock entering the anaerobic biodigester and verify physical gas output. ORBIT automatically computes school energy allocations."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Start Conversion Cycle</h2>
            <Badge tone="green">Community Facility</Badge>
          </div>
          <ConversionForm
            facilities={formattedFacilities}
            batches={formattedBatches}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Conversion Cycles</h2>
            <span className="text-xs text-slate-500">{cycles.length} recorded</span>
          </div>
          <div className="mt-4 grid gap-3">
            {cycles.map((cycle) => (
              <Link
                key={cycle.id}
                href={`/operations/conversions/${cycle.id}`}
                className="group block rounded-xl border border-slate-200 p-4 transition-all hover:border-[var(--orbit-primary)]/50 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[var(--orbit-primary)] group-hover:underline">
                    {cycle.cycleCode}
                  </p>
                  <Badge tone="green">Verified Output</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">{cycle.facility.organisation.name}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400">Verified: </span>
                    <strong className="text-slate-900">{formatGas(cycle.verifiedGasM3)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Allocatable: </span>
                    <strong className="text-emerald-700">{formatGas(cycle.allocatableGasM3)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Allocations: </span>
                    <strong className="text-slate-700">{cycle.allocations.length} pools</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

