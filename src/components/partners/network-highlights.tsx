import Link from "next/link";
import { Award, Flame, Sparkles, Trophy } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { NetworkHighlight } from "@/lib/services/partner-service";

const iconMap = {
  MOST_IMPACTFUL: Trophy,
  BEST_QUALITY: Sparkles,
  MOST_CONSISTENT: Flame,
  RISING_CONTRIBUTOR: Award,
};

export function NetworkHighlights({ highlights }: { highlights: NetworkHighlight[] }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <section className="mt-8" aria-label="Network Recognition Highlights">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Recognition Highlights</h2>
          <p className="text-sm text-slate-600">
            Deterministically calculated from verified inspection and weekly contribution records.
          </p>
        </div>
        <Badge tone="amber">Simulated Demo</Badge>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => {
          const Icon = iconMap[item.role] || Award;
          return (
            <Card
              key={item.role}
              className="group relative flex flex-col justify-between overflow-hidden border border-slate-200 transition-all hover:border-[var(--orbit-primary)] hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--orbit-primary)]/10 text-[var(--orbit-primary)]">
                    <Icon size={20} aria-hidden />
                  </span>
                  <Badge tone={item.badgeTone}>{item.title}</Badge>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[var(--orbit-primary)]">
                  <Link href={`/partners/${item.partner.slug}`} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {item.partner.name}
                  </Link>
                </h3>
                <p className="text-xs font-semibold text-slate-500">{item.partner.statusLabel} · {item.partner.city}</p>

                <div className="mt-4 rounded-md bg-slate-50 p-3">
                  <p className="text-base font-bold text-slate-900">{item.headline}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.subtext}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-[var(--orbit-primary)]">
                <span>View Public Profile</span>
                <span aria-hidden="true">→</span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
