import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Card, LinkButton } from "@/components/ui";

export default function AboutPage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="orbit-container py-12">
        <h1 className="text-5xl font-bold text-[var(--orbit-secondary)]">About ORBIT</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">ORBIT was shaped for the JA WE Challenge 2026 theme: Reimagine Energy, Powering Our Future from Waste. The team focused on organic waste because it is recurring, visible to students, and technically connected to anaerobic digestion when handled safely by validated operators.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {["A biodigester at every school was rejected as the default because feedstock stability, safety, maintenance, and adult operation are serious constraints.", "Community operators are better positioned to validate conversion, measurement, maintenance, and safety responsibilities.", "The software innovation is the auditable connection between waste purity, logistics, verified gas, and fair allocation.", "RPL/software-development skills are used for traceability, workflow design, data modelling, validation, and public transparency."].map((item) => (
            <Card key={item}><p className="leading-7">{item}</p></Card>
          ))}
        </div>
        <Card className="mt-8">
          <p className="font-semibold">ORBIT does not replace trained operators, physical safety systems, or verified energy measurements. It connects source quality, logistics, conversion performance, and energy allocation into one auditable loop.</p>
        </Card>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/methodology">Methodology</LinkButton>
          <LinkButton href="/sources" variant="secondary">References and sources</LinkButton>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
