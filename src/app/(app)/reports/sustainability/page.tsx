import { Card, Metric, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";

export default async function SustainabilityPage() {
  await requireUser("view_reports");
  const [assumption, cycles, inspections] = await Promise.all([
    prisma.financialAssumption.findFirst({ where: { active: true } }),
    prisma.conversionCycle.findMany({ include: { digestate: true } }),
    prisma.contaminationInspection.findMany(),
  ]);
  const accepted = inspections.reduce((sum, item) => sum + item.acceptedMassKg, 0);
  const verifiedGas = cycles.reduce((sum, item) => sum + item.verifiedGasM3, 0);
  const digestateValue = cycles.flatMap((cycle) => cycle.digestate).reduce((sum, item) => sum + item.valueEstimate, 0);
  const energySavings = verifiedGas * (assumption?.energyPricePerM3 ?? 0);
  const wasteSavings = accepted * (assumption?.wasteSavingsPerKg ?? 0);
  const cost = accepted * ((assumption?.collectionCostPerKg ?? 0) + (assumption?.processingCostPerKg ?? 0)) + cycles.length * (assumption?.maintenanceCostPerCycle ?? 0);
  const fee = ((assumption?.platformFeePercent ?? 5) / 100) * (energySavings + wasteSavings);
  const net = energySavings + wasteSavings + digestateValue - cost - fee;
  return (
    <div className="grid gap-6">
      <PageHeader title="Sustainability Report" description="Financial and LPG-equivalent values are pilot assumptions, not audited savings. The initial ORBIT fee is labelled as a 5% configurable assumption." />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Accepted diversion" value={formatKg(accepted)} hint="Measured." />
        <Metric label="Verified gas" value={formatGas(verifiedGas)} hint="Measured." />
        <Metric label="Estimated LPG equivalent" value={`${(verifiedGas / 0.47).toFixed(1)} kg`} hint="Assumed conversion factor." />
        <Metric label="Estimated net benefit" value={`Rp ${Math.round(net).toLocaleString("id-ID")}`} hint="Pilot formula, pending validation." />
      </div>
      <Card>
        <h2 className="text-lg font-bold">Prototype net benefit formula</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          netBenefit = energySavings + wasteManagementSavings + validatedDigestateValue - collectionCost - processingCost - maintenanceCost - platformFee.
        </p>
      </Card>
    </div>
  );
}
