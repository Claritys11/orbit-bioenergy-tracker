import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { ArrowLeft, BookOpen, Flame, Leaf, Microchip, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";

export default function StudentLearnPage() {
  const topics = [
    {
      icon: Flame,
      title: "The Four Stages of Anaerobic Digestion",
      description: "Inside the sealed biodigester, a microbial community breaks down complex organic polymers in the complete absence of dissolved oxygen.",
      points: [
        "Hydrolysis: Enzymes break complex carbs, lipids, and proteins into soluble monomers (sugars, fatty acids, amino acids).",
        "Acidogenesis: Fermentative bacteria convert monomers into volatile fatty acids (VFAs) and alcohols.",
        "Acetogenesis: Acetogenic microbes convert VFAs into acetic acid, CO₂, and hydrogen.",
        "Methanogenesis: Strictly anaerobic methanogenic Archaea synthesize methane gas (CH₄, 55-65%) and carbon dioxide.",
      ],
    },
    {
      icon: ShieldAlert,
      title: "Why Contamination Ruin Digesters (Contamination Impact)",
      description: "Non-biodegradable trash is not just an aesthetic issue; it actively cripples the biological machinery of community digesters.",
      points: [
        "Inorganics & Plastics: Plastic wrappers and straws do not decompose. They float to form a rigid crust or sink to clog drainage valves.",
        "Chemical Inhibitors: Bleach, sanitizers, and detergents kill sensitive methanogenic bacteria, causing digester 'souring' (acid buildup).",
        "Physical Volume Waste: Inorganic junk consumes valuable digester retention space without producing any biogas.",
        "ORBIT Allocation Impact: Batches with >30% contamination are rejected by facility inspection and earn zero energy credits.",
      ],
    },
    {
      icon: Leaf,
      title: "Landfill Methane vs Controlled Bioenergy",
      description: "Supit Urang landfill in Malang City receives hundreds of tonnes of organic waste every day. Here is why ORBIT intervenes.",
      points: [
        "Open Landfill Rot: Organics buried under mixed garbage ferment uncontrolled, leaking fugitive methane into the atmosphere.",
        "Global Warming Potential: Methane (CH₄) has 28 to 36 times the warming potential of CO₂ over a 100-year timescale.",
        "ORBIT Circular Solution: By capturing biogas in sealed digesters, schools replace LPG fossil fuels while stopping open atmospheric leaks.",
        "Digestate Nutrient Return: The liquid byproduct (digestate) returns to school gardens as high-nitrogen organic biofertilizer.",
      ],
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <Link href="/student/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <PageHeader
        title="Bioenergy Science & Feedstock Learning"
        description="Understand the biological principles, greenhouse gas benefits, and sorting requirements behind ORBIT circular energy."
      />

      <div className="grid gap-6">
        {topics.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.title} className="p-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--orbit-primary)]/10 text-[var(--orbit-primary)]">
                  <Icon size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{t.title}</h2>
                  <p className="text-xs text-slate-500">{t.description}</p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 pl-4 list-disc text-xs text-slate-700 leading-relaxed">
                {t.points.map((pt, idx) => (
                  <li key={idx} className="pl-1">
                    {pt}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center rounded-xl bg-slate-900 text-white p-6">
        <div>
          <h3 className="text-base font-bold">Ready to see your school&apos;s real numbers?</h3>
          <p className="text-xs text-slate-300 mt-1">Explore your school&apos;s verified organic contribution and energy metrics.</p>
        </div>
        <LinkButton href="/student/school" className="bg-[#00C972] text-black hover:bg-[#00C972]/90 font-bold text-xs">
          View School Impact →
        </LinkButton>
      </div>
    </div>
  );
}
