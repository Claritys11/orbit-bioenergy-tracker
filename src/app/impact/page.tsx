import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { PublicMetric } from "@/components/public/public-metric";
import { Card, LinkButton } from "@/components/ui";
import { getPublicImpactData } from "@/lib/public-data";
import { formatGas, formatKg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicImpactPage() {
  const data = await getPublicImpactData();
  return (
    <>
      <PublicHeader />
      <main id="main" className="orbit-container py-12">
        <h1 className="text-5xl font-bold text-[var(--orbit-primary)]">Public Impact</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">Impact is shown across environmental, energy, economic, social, and educational dimensions. Carbon reduction is not claimed without a validated baseline.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <PublicMetric label="Accepted organic waste" value={formatKg(data.metrics.acceptedWaste)} unit="measured at inspection" confidence="Measured" period={data.period} updated={data.lastUpdated} />
          <PublicMetric label="Verified energy carrier" value={formatGas(data.metrics.verifiedGas)} unit="biogas" confidence="Measured" period={data.period} updated={data.lastUpdated} />
          <PublicMetric label="Estimated LPG equivalent" value={`${(data.metrics.verifiedGas / 0.47).toFixed(1)} kg`} unit="assumption" confidence="Estimated" period={data.period} updated={data.lastUpdated} />
          <PublicMetric label="Education reach" value={`${data.metrics.schools}`} unit="demo schools" confidence="Simulated Demo" period={data.period} updated={data.lastUpdated} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {["Environmental: accepted organics diverted from unmanaged disposal pathways.", "Energy: verified biogas allocation tracked separately from estimates.", "Economic: savings model remains an assumption until field costs are validated.", "Educational: students learn sorting accuracy without being pushed to create more waste."].map((item) => (
            <Card key={item}><p className="leading-7">{item}</p></Card>
          ))}
        </div>
        <LinkButton href="/methodology" className="mt-8">Read calculation methodology</LinkButton>
      </main>
      <PublicFooter />
    </>
  );
}
