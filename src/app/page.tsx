import { ArrowRight, ClipboardCheck, Factory, QrCode, ShieldCheck, Zap } from "lucide-react";
import { auth } from "@/auth";
import { Card, LinkButton } from "@/components/ui";

const flow = [
  "Waste registration",
  "Quality verification",
  "Collection",
  "Conversion",
  "Verified biogas",
  "Fair allocation",
];

const features = [
  { Icon: QrCode, title: "Secure QR traceability", body: "QR payloads use safe opaque identifiers." },
  { Icon: ClipboardCheck, title: "Operator inspections", body: "Contamination directly affects contribution." },
  { Icon: Factory, title: "Measured conversion", body: "Verified gas records remain separate from estimates." },
  { Icon: Zap, title: "Fair allocation", body: "50/30/20 demo pools with versioned audit trail." },
];

export default async function Home() {
  const session = await auth();
  return (
    <main className="min-h-screen bg-[#f6f8f5]">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(15,118,110,0.45),rgba(245,158,11,0.18)_45%,rgba(15,23,42,0.9))]" />
        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl gap-10 px-5 py-8 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
              Organic Recycling & Bioenergy Impact Tracker
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-bold tracking-normal md:text-7xl">
              ORBIT
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              A school-to-community operations platform that traces canteen organics into
              verified biogas allocation with transparent purity-to-power scoring.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={session ? "/dashboard" : "/login"} className="bg-amber-400 text-slate-950 hover:bg-amber-300">
                Open operations <ArrowRight size={16} aria-hidden />
              </LinkButton>
              <LinkButton href="/trace/demo" variant="secondary">
                View safe trace page
              </LinkButton>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-2">
              {flow.map((item, index) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-semibold text-amber-200">0{index + 1}</p>
                  <p className="mt-2 font-semibold">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md bg-teal-400/15 p-4 text-sm leading-6 text-teal-50">
              Estimated gas and measured gas are never blended. Allocation uses only verified
              allocatable gas after operational use and safety reserve.
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-4 lg:px-8">
        {features.map(({ Icon, title, body }) => (
          <Card key={title}>
            <Icon className="mb-4 text-teal-700" size={24} aria-hidden />
            <h2 className="font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </Card>
        ))}
      </section>
      <footer className="border-t border-slate-200 px-5 py-6 text-center text-sm text-slate-500">
        <ShieldCheck size={16} className="mr-1 inline text-teal-700" aria-hidden />
        ORBIT monitors operations. Certified local hardware and trained adult operators handle
        safety-critical shutdowns.
      </footer>
    </main>
  );
}
