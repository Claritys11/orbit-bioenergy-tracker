import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Card, LinkButton } from "@/components/ui";

const formulas = [
  ["Contamination rate", "rejectedMass / verifiedGrossMass * 100", "Measured from operator inspection."],
  ["Accepted mass", "verifiedGrossMass - rejectedMass", "Rejected or unsafe material receives zero contribution."],
  ["Contribution score", "acceptedMass * yieldFactor * qualityFactor * conditionFactor", "Internal ORBIT calculation."],
  ["Estimated gas", "acceptedMass * yieldFactor * conditionFactor", "Educational estimate, not verified output."],
  ["Allocatable gas", "verifiedGas - operationalUse - safetyReserve", "Measured gas basis for allocation."],
  ["Individual allocation", "poolAllocation * individualScore / poolScore", "Finalised only after review."],
];

export default function MethodologyPage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="orbit-container py-12">
        <Badge tone="blue">Plain-language methodology</Badge>
        <h1 className="mt-4 text-5xl font-bold text-[var(--orbit-primary)]">Methodology</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">ORBIT distinguishes data collected from operators, internal calculations, pilot assumptions, simulated demo data, and field research still required.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {formulas.map(([title, formula, body]) => (
            <Card key={title}>
              <h2 className="font-bold">{title}</h2>
              <code className="mt-3 block rounded-md bg-slate-950 p-3 text-sm text-white">{formula}</code>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-8">
          <h2 className="text-lg font-bold">Revision history</h2>
          <p className="mt-2 text-sm text-slate-600">Version 1: prototype calculation model and demo dataset. Future versions must record field validation, correction reasons, and partner-approved assumptions.</p>
        </Card>
        <LinkButton href="/sources" className="mt-8" variant="secondary">Open sources</LinkButton>
      </main>
      <PublicFooter />
    </>
  );
}
