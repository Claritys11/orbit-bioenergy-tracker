import { Card, PageHeader, LinkButton, Badge } from "@/components/ui";
import { ArrowLeft, ArrowRight, CheckCircle2, Factory, Recycle, ShieldCheck, Sparkles, Truck, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function StudentJourneyPage() {
  const steps = [
    {
      num: "01",
      title: "Canteen Sorting at Source",
      role: "Students & Canteen Staff",
      icon: Recycle,
      summary: "Food scraps, fruit peels, and cooked leftovers are separated from single-use plastics and wrappers.",
      detail: "Clean sorting prevents inorganic contaminants like polythene from entering the biodigester where they would smother anaerobic bacteria.",
      stat: "Target Contamination: < 8%",
    },
    {
      num: "02",
      title: "Reusable QR Container Storage",
      role: "Canteen Operators",
      icon: CheckCircle2,
      summary: "Waste is placed in assigned 50L plastic drums tagged with a persistent digital QR tag (e.g. CNT-SMK99M-001).",
      detail: "The QR code links the physical container to the school's digital account without needing single-use QR stickers for each batch.",
      stat: "Zero Single-Use Plastic Waste",
    },
    {
      num: "03",
      title: "Coordinated Logistics Dispatch",
      role: "Logistics Operator",
      icon: Truck,
      summary: "Schools request collection when bins are full. The operator dispatches vehicle D 2046 ORB to collect the containers.",
      detail: "Batches move through SCHEDULED and IN_TRANSIT states with transparent timestamps visible to both schools and facility staff.",
      stat: "Full Custody Tracking",
    },
    {
      num: "04",
      title: "TPS3R Calibrated Weighing & Inspection",
      role: "Community Facility Team",
      icon: Factory,
      summary: "Containers arrive at the community TPS3R hub. Staff measure verified gross weight and separate any remaining contaminants.",
      detail: "Net accepted organics = gross weight - rejected weight. High contamination rates reduce allocation scores.",
      stat: "Verified Scale Measurement",
    },
    {
      num: "05",
      title: "Anaerobic Biodigestion",
      role: "Certified Adult Technicians",
      icon: Zap,
      summary: "Accepted organic feedstock is fed into sealed anaerobic biodigesters where methanogenic bacteria ferment the waste.",
      detail: "Biochemical breakdown produces methane (CH₄, 55-65%) and carbon dioxide (CO₂), preventing fugitive open-landfill methane emissions.",
      stat: "~0.12 - 0.25 m³ Biogas per kg",
    },
    {
      num: "06",
      title: "Physical Gas Verification",
      role: "Community Facility Personnel",
      icon: Sparkles,
      summary: "Produced biogas flows through physical flow meters. The measured output is verified and locked in ORBIT.",
      detail: "ORBIT strictly distinguishes between theoretical yield estimates and actual metered biogas before generating credits.",
      stat: "100% Measured Output",
    },
    {
      num: "07",
      title: "Purity-to-Power Allocation & Return",
      role: "ORBIT Automated Engine",
      icon: Users,
      summary: "Verified energy is split: 50% to participating schools, 30% to Community Facility / O&M Pool, and 20% to supporting contributors.",
      detail: "Schools receive verifiable clean energy credits that offset canteen fuel costs or power community kitchens.",
      stat: "50% Direct School Benefit",
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
        title="Interactive Circular Journey"
        description="Follow organic waste through every verified physical and biological stage: from canteen plate scraps to clean bioenergy."
      />

      <div className="grid gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.num} className="p-6 transition hover:border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--orbit-primary)]/10 text-[var(--orbit-primary)] font-black text-lg">
                    {step.num}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{step.title}</h2>
                      <Badge tone="blue">{step.role}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">{step.summary}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.detail}</p>
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="inline-block rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-600/20">
                    {step.stat}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-white p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-700" size={24} />
          <h2 className="text-lg font-bold text-slate-900">Safety First: Why Students Do Not Operate Gas Machinery</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 max-w-2xl">
          Anaerobic biodigesters produce pressurized flammable gas requiring certified pressure-relief valves, gas filtration, and trained adult facility personnel. Students focus on the upstream science of sorting, software traceability, and biological education.
        </p>
        <div className="mt-4 flex gap-3">
          <LinkButton href="/student/learn" variant="secondary" className="text-xs font-bold">
            Read Sorting & Biology Guide →
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
