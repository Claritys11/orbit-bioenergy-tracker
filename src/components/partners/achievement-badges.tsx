import {
  Award,
  Building2,
  CheckCircle2,
  Flame,
  FlameKindling,
  Lock,
  Recycle,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui";
import type { PartnerAchievement } from "@/lib/domain/partner-recognition";

const iconComponentMap: Record<string, typeof Trophy> = {
  Sprout,
  Sparkles,
  ShieldCheck,
  Flame,
  FlameKindling,
  Trophy,
  Recycle,
  Award,
  Zap,
  CheckCircle2,
  Building2,
};

export function AchievementBadges({ achievements }: { achievements: PartnerAchievement[] }) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Partner Recognition Badges</h3>
          <p className="text-xs text-slate-500">
            Earned through verified sorting accuracy, weekly consistency, and circular bioenergy participation.
          </p>
        </div>
        <Badge tone={unlockedCount > 0 ? "green" : "slate"}>
          {unlockedCount} of {achievements.length} Unlocked
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((item) => {
          const Icon = iconComponentMap[item.iconName] || Trophy;
          const isUnlocked = item.unlocked;

          return (
            <div
              key={item.key}
              className={`flex flex-col justify-between rounded-lg border p-4 transition-all ${
                isUnlocked
                  ? "border-emerald-200 bg-emerald-50/30 text-slate-900 shadow-xs"
                  : "border-slate-200 bg-slate-50/60 text-slate-500"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-lg ${
                      isUnlocked
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {isUnlocked ? <Icon size={18} aria-hidden /> : <Lock size={16} aria-hidden />}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isUnlocked ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {item.criteriaLabel}
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                {isUnlocked ? (
                  <span className="font-semibold text-emerald-700">
                    Unlocked {item.unlockedAt ? new Date(item.unlockedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                  </span>
                ) : (
                  <div className="w-full">
                    <div className="flex justify-between font-semibold text-slate-500 mb-1">
                      <span>In Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[var(--orbit-primary)] transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
