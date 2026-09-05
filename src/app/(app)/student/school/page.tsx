import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Factory, GraduationCap, Recycle, Sparkles, Zap } from "lucide-react";
import { Badge, Card, LinkButton, Metric, MobileCard, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";

export default async function StudentSchoolImpactPage() {
  const user = await requireUser();
  if (!user.organisationId) {
    redirect("/student/dashboard");
  }

  const [org, batches, inspections, allocations] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id: user.organisationId },
      include: { school: true },
    }),
    prisma.wasteBatch.findMany({
      where: { sourceOrganisationId: user.organisationId },
      include: { category: true, inspection: true, container: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.contaminationInspection.findMany({
      where: { batch: { sourceOrganisationId: user.organisationId } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.energyAllocation.findMany({
      where: { recipientOrgId: user.organisationId },
      include: { fulfilments: true, cycle: true },
      orderBy: { finalisedAt: "desc" },
    }),
  ]);

  if (!org) {
    redirect("/student/dashboard");
  }

  const totalAcceptedKg = inspections.reduce((s, i) => s + i.acceptedMassKg, 0);
  const totalAllocatedGas = allocations.reduce((s, a) => s + a.allocatedGasM3, 0);
  const totalFulfilledGas = allocations.reduce(
    (s, a) => s + a.fulfilments.reduce((sum, f) => sum + f.volumeM3, 0),
    0,
  );

  const avgContamination =
    inspections.length > 0
      ? (inspections.reduce((s, i) => s + i.contaminationRate, 0) / inspections.length).toFixed(1)
      : "0";

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <Link href="/student/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <PageHeader
        title={`${org.name} Circular Bioenergy Impact`}
        description="Real-world verified bioenergy contribution from your school's canteen sorting and community processing."
        action={
          <LinkButton href={`/partners/${org.slug}`} variant="secondary" className="text-xs">
            View Public Partner Profile →
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Metric
          label="Verified Accepted Organics"
          value={formatKg(totalAcceptedKg)}
          hint="Net clean feedstock weighed at hub"
          confidence="Verified"
        />
        <Metric
          label="Average Purity Level"
          value={`${100 - Number(avgContamination)}%`}
          hint={`Average contamination: ${avgContamination}%`}
          confidence="Calculated"
        />
        <Metric
          label="Allocated Biogas Credits"
          value={formatGas(totalAllocatedGas)}
          hint="50% school energy return pool"
          confidence="Calculated"
        />
        <Metric
          label="Fulfilled Clean Energy"
          value={formatGas(totalFulfilledGas)}
          hint="Delivered bioenergy benefit"
          confidence="Measured"
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your School&apos;s Recent Waste Loads</h3>
            <p className="text-xs text-slate-500">Track how each batch performed during community facility inspection</p>
          </div>
          <Badge tone="green">Live School Data</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {batches.map((b) => (
            <MobileCard key={b.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-slate-900">{b.batchCode}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {b.container?.containerCode ?? "Standard Drum"}
                </p>
                <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                  <p>
                    Accepted:{" "}
                    <strong>
                      {b.inspection ? formatKg(b.inspection.acceptedMassKg) : "Pending weighing"}
                    </strong>
                  </p>
                  {b.inspection ? (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      Purity: {(100 - b.inspection.contaminationRate).toFixed(0)}% clean
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                {new Date(b.createdAt).toLocaleDateString()}
              </p>
            </MobileCard>
          ))}
        </div>
      </Card>
    </div>
  );
}
