import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Card, LinkButton } from "@/components/ui";

const formulas = [
  ["Contamination rate", "rejectedMass / verifiedGrossMass * 100", "Measured directly by TPS3R operator during physical inspection at facility."],
  ["Accepted mass basis", "verifiedGrossMass - rejectedMass", "Clean organic feedstock basis for biodigester. Contaminated or rejected material receives zero contribution."],
  ["Contribution score", "acceptedMass * yieldFactor * qualityFactor * conditionFactor", "Used to calculate fair proportional shares inside beneficiary pools."],
  ["Estimated gas", "acceptedMass * yieldFactor * conditionFactor", "Educational preview and planning estimate. Never treated as actual produced gas."],
  ["Allocatable gas", "verifiedGas - operationalUse - safetyReserve", "Measured gas basis strictly recorded post-conversion."],
  ["Individual allocation", "poolAllocation * (individualScore / poolScore)", "Finalised allocations are not silently overwritten. Revisions create new versions."],
];

export default function MethodologyPage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="orbit-container py-12">
        <Badge tone="blue">Plain-Language Methodology & Data Rules</Badge>
        <h1 className="mt-4 text-5xl font-bold text-[var(--orbit-primary)]">Methodology</h1>
        
        <blockquote className="mt-4 border-l-4 border-[var(--orbit-primary)] bg-slate-50 p-4 italic text-slate-700">
          “ORBIT is a digital coordination and traceability system that connects schools with community waste-to-energy operators, turning verified organic waste contributions into measurable and traceable energy returns.”
        </blockquote>

        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <h2 className="font-bold">🛡️ Principle: No Verified Source Identity = No Source-Specific Energy Allocation</h2>
          <p className="mt-1 leading-relaxed">
            TPS3R operators may process un-tagged organic waste, but only persistent reusable QR containers allow clean organic contributions to be reliably attributed and credited back to participating schools and community partners.
          </p>
        </div>

        <h2 className="mt-10 text-2xl font-bold text-slate-900">Chain of Custody & Formula Engine</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {formulas.map(([title, formula, body]) => (
            <Card key={title}>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <code className="mt-3 block rounded-md bg-slate-950 p-3 font-mono text-sm text-white">{formula}</code>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">Chain of Custody Mass Separation</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            ORBIT preserves complete historical provenance across all collection phases. Values are recorded separately and never overwritten:
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <li>• <strong className="text-slate-900">Declared Mass:</strong> Self-reported weight by canteen staff upon bin registration.</li>
            <li>• <strong className="text-slate-900">Collected Mass:</strong> Weight measured by operator during vehicle pickup.</li>
            <li>• <strong className="text-slate-900">Verified Gross Mass:</strong> Physical gross weight upon arrival at TPS3R.</li>
            <li>• <strong className="text-slate-900">Rejected Mass:</strong> Non-organic/incompatible material separated during inspection.</li>
            <li>• <strong className="text-slate-900">Accepted Mass:</strong> Net clean feedstock loaded into the biodigester.</li>
          </ul>
        </Card>

        <Card className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">Revision & Model Integrity</h2>
          <p className="mt-2 text-sm text-slate-600">
            Version 1: Prototype calculation model and competition demo dataset. Methane yields, LPG conversion factors, and platform fees (5%) are pilot assumptions subject to local field calibration.
          </p>
        </Card>

        <div className="mt-8 flex gap-4">
          <LinkButton href="/sources" variant="secondary">Open Claim Sources</LinkButton>
          <LinkButton href="/transparency">View Live Transparency Dashboard</LinkButton>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
