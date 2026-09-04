import { Activity, CheckCircle2, Factory, PackageCheck, Recycle, Truck, Zap } from "lucide-react";
import { AllocationChart } from "@/components/allocation-chart";
import { PublicActivityFeed } from "@/components/public/activity-feed";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { PublicMetric } from "@/components/public/public-metric";
import { Badge, Card } from "@/components/ui";
import { getPublicImpactData } from "@/lib/public-data";
import { formatGas, formatKg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TransparencyPage() {
  const data = await getPublicImpactData();
  const flow = [
    { icon: Recycle, label: "Registered", value: formatKg(data.metrics.registeredWaste) },
    { icon: PackageCheck, label: "Inspected", value: formatKg(data.metrics.acceptedWaste + data.metrics.rejectedWaste) },
    { icon: CheckCircle2, label: "Accepted", value: formatKg(data.metrics.acceptedWaste) },
    { icon: Factory, label: "Processed", value: formatKg(data.metrics.acceptedWaste) },
    { icon: Zap, label: "Verified Gas", value: formatGas(data.metrics.verifiedGas) },
    { icon: Activity, label: "Allocated", value: formatGas(data.metrics.allocatedGas) },
    { icon: Truck, label: "Fulfilled", value: formatGas(data.metrics.fulfilledGas) },
  ];
  return (
    <>
      <PublicHeader />
      <main id="main" className="bg-[var(--background)]">
        <section className="border-b border-slate-200 bg-white py-12">
          <div className="orbit-container">
            <Badge tone="amber">Demonstration dataset - not field-validated pilot results</Badge>
            <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-slate-950">Transparency Dashboard</h1>
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-600">
              Public-safe monitoring separates registered, accepted, verified, allocated, and fulfilled values.
              Private emails, exact routes, vehicle identifiers, raw safety detail, and audit diffs are not exposed.
            </p>
          </div>
        </section>
        <section className="orbit-container py-10">
          <div className="mb-6 flex flex-wrap gap-2">
            {["7 days", "30 days", "3 months", "All time"].map((label) => (
              <button key={label} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{label}</button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <PublicMetric label="Registered waste" value={formatKg(data.metrics.registeredWaste)} unit="gross waste" confidence="Simulated Demo" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Accepted waste" value={formatKg(data.metrics.acceptedWaste)} unit="operator inspected" confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Rejected waste" value={formatKg(data.metrics.rejectedWaste)} unit={`${data.metrics.contaminationRate.toFixed(1)}% contamination`} confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Verified biogas" value={formatGas(data.metrics.verifiedGas)} unit="conversion cycle output" confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Allocatable biogas" value={formatGas(data.metrics.allocatableGas)} unit="after operations and reserve" confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Allocated biogas" value={formatGas(data.metrics.allocatedGas)} unit="finalised allocation" confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Fulfilled biogas" value={formatGas(data.metrics.fulfilledGas)} unit="physically delivered or hub-consumed" confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Partners" value={`${data.metrics.schools + data.metrics.partners}`} unit="demo organisations" confidence="Simulated Demo" period={data.period} updated={data.lastUpdated} />
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <h2 className="text-lg font-bold">Waste-to-energy flow</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-7">
                {flow.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-md border border-slate-200 p-3">
                      <Icon className="text-[var(--orbit-primary)]" size={20} aria-hidden />
                      <p className="mt-2 text-xs text-slate-500">{item.label}</p>
                      <p className="font-bold">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-bold">Allocation breakdown</h2>
              <AllocationChart data={[{ name: "Allocated", value: data.metrics.allocatedGas }, { name: "Fulfilled", value: data.metrics.fulfilledGas }, { name: "Pending", value: Math.max(0, data.metrics.allocatedGas - data.metrics.fulfilledGas) }]} />
            </Card>
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <h2 className="text-lg font-bold">Organisation contributions</h2>
              <div className="mt-4 grid gap-3">
                {data.contributions.map((org) => (
                  <div key={org.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><p className="font-semibold">{org.name}</p><p className="text-sm text-slate-500">{org.type}</p></div>
                      <Badge tone="blue">{org.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm">Accepted {formatKg(org.accepted)}. Contamination {org.contaminationRate.toFixed(1)}%.</p>
                  </div>
                ))}
              </div>
            </Card>
            <PublicActivityFeed items={data.activity} />
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
