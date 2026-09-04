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
      <main id="main" className="orbit-container py-10 sm:py-12">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--orbit-primary)] block">
          REGIONAL BIOENERGY PLATFORM
        </span>
        <h1 className="mt-1 text-3xl sm:text-5xl font-black tracking-tight text-slate-950">Public Impact</h1>
        <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-600">
          Impact is shown across environmental, energy, economic, and educational dimensions. Carbon reduction claims require calibrated facility baseline records.
        </p>
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
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Partner Contribution Transparency</h2>
            <p className="mt-1 text-sm text-slate-600">
              Explore the schools, community operators, and local vendors driving this verified bioenergy impact.
            </p>
          </div>
          <LinkButton href="/partners" className="shrink-0">
            See Who Contributed →
          </LinkButton>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <LinkButton href="/methodology" variant="secondary">Read calculation methodology</LinkButton>
          <LinkButton href="/transparency" variant="secondary">View live transparency feed</LinkButton>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
