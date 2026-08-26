import Link from "next/link";
import { ArrowRight, Building2, Factory, GraduationCap, ShieldCheck, Store, Users, Zap } from "lucide-react";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { PublicMetric } from "@/components/public/public-metric";
import { PurityCalculator } from "@/components/public/purity-calculator";
import { SystemFlow } from "@/components/public/system-flow";
import { Badge, Card, LinkButton } from "@/components/ui";
import { getPublicImpactData } from "@/lib/public-data";
import { formatGas, formatKg } from "@/lib/utils";

export const dynamic = "force-dynamic";

const workflow = [
  ["Sort", "Canteen staff separate eligible organic waste."],
  ["Register", "Waste is weighed and registered as a QR batch."],
  ["Collect", "ORBIT schedules pickup based on volume and storage time."],
  ["Verify", "Partner operators record contamination and accepted mass."],
  ["Convert", "Accepted waste enters a validated biodigestion facility."],
  ["Measure", "The facility records verified biogas production."],
  ["Allocate", "ORBIT calculates fair shares from verified allocatable gas."],
  ["Use and Report", "Fulfilment and public impact are recorded transparently."],
];

const userSteps = [
  ["School/Canteen", "Sign in, create a batch, enter category and weight, generate QR, prepare for pickup, monitor inspection, and view allocation."],
  ["Operator", "View incoming batches, schedule pickup, inspect contamination, create conversion cycles, record verified gas, confirm allocation, and record fulfilment."],
  ["Public Visitor", "Open Live Impact, inspect public organisations, trace a batch, read methodology, and verify sources."],
  ["Student", "Follow the waste journey, learn contamination feedback, and understand impact without handling gas equipment."],
];

const partnerCards = [
  { Icon: GraduationCap, title: "Participating schools", body: "Source-separated canteen waste and learning feedback." },
  { Icon: Factory, title: "TPS3R/KSM operators", body: "Adult-managed verification, conversion, safety, and fulfilment." },
  { Icon: Store, title: "Markets and vendors", body: "Supporting feedstock contributors that stabilise supply." },
  { Icon: Users, title: "Community partners", body: "Transparent community usage and benefit reporting." },
  { Icon: Building2, title: "Government and research", body: "Validation, policy alignment, and field evidence." },
  { Icon: Zap, title: "Technical partners", body: "Measurement, safety review, and biodigester feasibility." },
];

export default async function Home() {
  const data = await getPublicImpactData();
  return (
    <>
      <PublicHeader />
      <main id="main" className="bg-[#f6f8f5]">
        <section className="border-b border-[var(--orbit-border)] bg-white">
          <div className="orbit-container grid min-h-[82vh] gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge tone="amber">Demonstration dataset - awaiting field validation</Badge>
              <h1 className="mt-5 max-w-4xl text-5xl font-bold tracking-normal text-[var(--orbit-secondary)] md:text-7xl">
                Turning cleaner school waste into traceable community energy.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                ORBIT connects schools, community waste operators, and supporting contributors
                through a transparent system that tracks organic waste from collection to verified
                biogas allocation.
              </p>
              <p className="mt-4 text-sm font-semibold text-[var(--orbit-primary)]">
                Measured, estimated, and pilot data are always displayed separately.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/transparency" className="bg-[var(--orbit-primary)]">
                  Explore Live Impact <ArrowRight size={16} aria-hidden />
                </LinkButton>
                <LinkButton href="#how-it-works" variant="secondary">See How It Works</LinkButton>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-[#f8fbf7] p-5 shadow-sm">
              <SystemFlow />
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                The biodigester is not assumed to be installed at every school. ORBIT coordinates
                source quality, logistics, partner conversion, verified measurement, and allocation.
              </div>
            </div>
          </div>
        </section>

        <section id="overview" className="orbit-container py-16">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">Overview</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-bold text-[var(--orbit-secondary)]">A complete loop, not just a waste dashboard.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Schools act as waste sources and collection nodes. Validated community facilities
            perform conversion. Trained adults operate gas and biodigester equipment. Students
            focus on sorting, traceability, education, and software.
          </p>
          <div className="mt-8"><SystemFlow /></div>
        </section>

        <section className="bg-[var(--orbit-secondary)] py-16 text-white">
          <div className="orbit-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-300">Problem Background</p>
              <h2 className="mt-3 text-4xl font-bold">Why Malang, why schools, why coordination?</h2>
              <p className="mt-4 leading-7 text-slate-300">
                Malang City reported about 731.29 tonnes/day of waste in 2024, with organic waste
                at about 61%. In 2025, reporting cited about 800 tonnes/day and about 475 tonnes/day
                still entering Supit Urang landfill. ORBIT responds to this upstream sorting and
                integration gap.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <Link className="font-semibold text-amber-300" href="/sources">View claim sources</Link>
                <Link className="font-semibold text-amber-300" href="/methodology">Read methodology</Link>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "School canteens repeatedly generate organic waste.",
                "One school may not provide enough stable feedstock for its own digester.",
                "Community organic waste is larger but scattered or contaminated.",
                "Operators need clean, predictable, and traceable feedstock.",
                "Schools need visible feedback to motivate correct sorting.",
                "Waste and energy planning often operate separately.",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/8 p-4 text-sm leading-6">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="orbit-container py-16">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">How It Works</p>
          <h2 className="mt-3 text-4xl font-bold text-[var(--orbit-secondary)]">Physical workflow and user workflow stay aligned.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {workflow.map(([title, body], index) => (
              <Card key={title} className="reveal-on-scroll">
                <p className="text-sm font-bold text-amber-600">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {userSteps.map(([title, body]) => (
              <Card key={title} className="reveal-on-scroll">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="orbit-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">Purity-to-Power</p>
              <h2 className="mt-3 text-4xl font-bold text-[var(--orbit-secondary)]">ORBIT rewards accepted feedstock, not unverified gross waste.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Card><h3 className="font-bold">Batch A</h3><p className="mt-2 text-sm">20 kg gross, 1 kg rejected, 19 kg accepted. Lower contamination, higher contribution.</p></Card>
                <Card><h3 className="font-bold">Batch B</h3><p className="mt-2 text-sm">20 kg gross, 6 kg rejected, 14 kg accepted. Higher contamination, lower contribution.</p></Card>
              </div>
            </div>
            <PurityCalculator />
          </div>
        </section>

        <section id="live-impact" className="orbit-container py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">Live Impact Preview</p>
              <h2 className="mt-3 text-4xl font-bold text-[var(--orbit-secondary)]">Public-safe demonstration metrics.</h2>
              <p className="mt-3 text-sm text-slate-600">Demonstration dataset - not field-validated pilot results.</p>
            </div>
            <LinkButton href="/transparency">Open Full Live Impact Dashboard</LinkButton>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <PublicMetric label="Registered waste" value={formatKg(data.metrics.registeredWaste)} unit="gross waste" confidence="Simulated Demo" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Accepted waste" value={formatKg(data.metrics.acceptedWaste)} unit="operator inspected" confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Verified biogas" value={formatGas(data.metrics.verifiedGas)} unit="conversion records" confidence="Measured" period={data.period} updated={data.lastUpdated} />
            <PublicMetric label="Fulfilled biogas" value={formatGas(data.metrics.fulfilledGas)} unit="not merely allocated" confidence="Measured" period={data.period} updated={data.lastUpdated} />
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="orbit-container grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">Transparency</p>
              <h2 className="mt-3 text-4xl font-bold text-[var(--orbit-secondary)]">Built to prevent misleading reporting.</h2>
              <div className="mt-6 grid gap-3">
                {[
                  "Estimated gas is separated from verified gas.",
                  "Rejected waste is not counted as accepted contribution.",
                  "Unfulfilled allocation is not counted as delivered energy.",
                  "Every critical change is recorded through an audit trail.",
                ].map((item) => <Card key={item} className="reveal-on-scroll"><p className="font-semibold">{item}</p></Card>)}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">Allocation Model</p>
              <h2 className="mt-3 text-4xl font-bold text-[var(--orbit-secondary)]">50 / 30 / 20 is a pilot assumption.</h2>
              <div className="mt-6 grid gap-3">
                {[["Schools", "50%"], ["Partner operator", "30%"], ["Supporting contributors", "20%"]].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between"><span className="font-bold">{label}</span><span className="text-2xl font-bold text-amber-600">{value}</span></div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Percentages apply only after operational use and safety reserve are deducted from verified gas.
              </p>
            </div>
          </div>
        </section>

        <section id="partners" className="orbit-container py-16">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--orbit-primary)]">Partners</p>
          <h2 className="mt-3 text-4xl font-bold text-[var(--orbit-secondary)]">Different roles, clear responsibilities.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {partnerCards.map(({ Icon, title, body }) => (
              <Card key={title}>
                <Icon size={24} className="text-[var(--orbit-primary)]" aria-hidden />
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-[var(--orbit-secondary)] py-16 text-white">
          <div className="orbit-container grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-300">Safety and Limitations</p>
              <h2 className="mt-3 text-4xl font-bold">Trust also means drawing hard boundaries.</h2>
              <p className="mt-4 leading-7 text-slate-300">
                ORBIT does not replace trained operators, physical safety systems, or verified energy measurements. Low-pressure gas bags require engineering and legal validation.
              </p>
            </div>
            <div className="grid gap-3">
              {["Students do not handle biodigesters, gas bags, valves, or hazardous machinery.", "Emergency shutdown requires local certified hardware.", "Compressed Bio-CNG and electricity generation are outside MVP.", "Current pilot numbers include assumptions or simulation data."].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/8 p-4">
                  <ShieldCheck className="shrink-0 text-amber-300" size={20} aria-hidden />
                  <p className="text-sm leading-6">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="orbit-container py-16">
          <h2 className="text-4xl font-bold text-[var(--orbit-secondary)]">FAQ</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ["Is the biodigester installed at school?", "No. The school is a waste source and collection node unless a facility is separately validated."],
              ["Does every TPS3R have a biodigester?", "No. ORBIT tracks biodigester status explicitly and never assumes capability."],
              ["Why does contamination affect allocation?", "Only accepted, conversion-ready feedstock should earn contribution."],
              ["Can the public monitor ORBIT?", "Yes, through public-safe transparency pages and QR traces."],
              ["Are displayed numbers measured?", "Each metric is labelled measured, estimated, simulated demo, pilot assumption, or pending validation."],
              ["Do students handle gas equipment?", "No. Students learn sorting, tracing, and software; trained adults handle facility operations."],
            ].map(([question, answer]) => (
              <Card key={question}><h3 className="font-bold">{question}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p></Card>
            ))}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="orbit-container text-center">
            <h2 className="text-4xl font-bold text-[var(--orbit-secondary)]">Follow every verified step from cleaner organic waste to community energy.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/impact">Explore Public Impact</LinkButton>
              <LinkButton href="/login" variant="secondary">Sign In as a Partner</LinkButton>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
