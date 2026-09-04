import type { OrganisationType } from "@prisma/client";

export interface ContributionEvent {
  date: Date;
  grossMassKg: number;
  acceptedMassKg: number;
  rejectedMassKg: number;
  decision: "ACCEPTED" | "CONDITIONAL" | "REJECTED";
  contaminationRate: number;
  batchCode?: string;
  qrToken?: string;
  categoryName?: string;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveWeeks: number;
  lastContributionDate: Date | null;
  activeWeeksHistory: string[]; // List of ISO week keys e.g. "2026-W34"
}

export interface WeeklyHeatmapCell {
  isoWeek: string; // e.g. "2026-W33"
  weekStart: string; // ISO date string for Monday
  weekLabel: string; // e.g. "17 Aug"
  contributionCount: number;
  acceptedMassKg: number;
  grossMassKg: number;
  averageAcceptanceRate: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface PartnerAchievement {
  key: string;
  title: string;
  description: string;
  category: "QUALITY" | "CONSISTENCY" | "MILESTONE" | "TRACEABILITY" | "PILOT";
  iconName: string;
  unlocked: boolean;
  unlockedAt: string | null; // ISO string
  progress: number; // 0 to 100
  criteriaLabel: string;
}

export interface PartnerRecognitionMetrics {
  acceptedMassKg: number;
  grossMassKg: number;
  rejectedMassKg: number;
  acceptanceRate: number; // 0 - 100
  totalBatches: number;
  verifiedBatches: number;
  streak: StreakStats;
  traceableGasM3: number;
  allocatedGasM3: number;
  fulfilledGasM3: number;
  orbitRecognitionScore: number; // 0 - 100
}

export interface PartnerSummary {
  id: string;
  name: string;
  slug: string;
  type: OrganisationType;
  statusLabel: string;
  city: string;
  joinedAt: Date;
  metrics: PartnerRecognitionMetrics;
  topAchievements: PartnerAchievement[];
  isFounding: boolean;
}

export type LeaderboardCategory = "overall" | "diverted" | "quality" | "consistency" | "energy";

export interface LeaderboardEntry {
  rank: number;
  partner: PartnerSummary;
  primaryValue: string;
  primaryMetricLabel: string;
  secondaryValue: string;
}

/**
 * Converts a date into an ISO-8601 week key: "YYYY-Www"
 * ISO weeks start on Monday and week 1 is the week with the first Thursday of the year.
 */
export function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Returns Monday 00:00:00 UTC for a given ISO week key (e.g. "2026-W34")
 */
export function getIsoWeekStartDate(isoWeekKey: string): Date {
  const [yearStr, weekStr] = isoWeekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  // Jan 4th is always in week 1 of ISO-8601
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4.getTime() - (jan4Day - 1) * 86400000);
  return new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000);
}

/**
 * Calculates weekly streak strictly adhering to ISO weeks.
 * Rules:
 * 1. Only weeks with at least one eligible contribution count (acceptedMassKg > 0 & decision in [ACCEPTED, CONDITIONAL]).
 * 2. Rejected-only batches do NOT count toward active weeks.
 * 3. Multiple contributions in the same ISO week count as 1 active week.
 * 4. Current streak counts backwards from current/previous ISO week.
 */
export function calculateWeeklyStreak(
  events: ContributionEvent[],
  referenceDate: Date = new Date(),
): StreakStats {
  const eligibleEvents = events.filter(
    (e) => e.acceptedMassKg > 0 && (e.decision === "ACCEPTED" || e.decision === "CONDITIONAL"),
  );

  if (eligibleEvents.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveWeeks: 0,
      lastContributionDate: null,
      activeWeeksHistory: [],
    };
  }

  // Sort chronological
  eligibleEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  const lastEvent = eligibleEvents[eligibleEvents.length - 1];

  // Group into unique sorted ISO weeks
  const activeWeeksSet = new Set<string>();
  for (const event of eligibleEvents) {
    activeWeeksSet.add(getIsoWeekKey(event.date));
  }

  const sortedWeeks = Array.from(activeWeeksSet).sort();
  const totalActiveWeeks = sortedWeeks.length;

  if (totalActiveWeeks === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveWeeks: 0,
      lastContributionDate: null,
      activeWeeksHistory: [],
    };
  }

  // Helper to get week difference between two ISO week keys
  function weekDiff(prevWeekKey: string, nextWeekKey: string): number {
    const prevDate = getIsoWeekStartDate(prevWeekKey);
    const nextDate = getIsoWeekStartDate(nextWeekKey);
    const diffMs = nextDate.getTime() - prevDate.getTime();
    return Math.round(diffMs / (7 * 86400000));
  }

  // Calculate longest streak across history
  let longestStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < sortedWeeks.length; i++) {
    const diff = weekDiff(sortedWeeks[i - 1], sortedWeeks[i]);
    if (diff === 1) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (diff > 1) {
      runningStreak = 1;
    }
  }

  // Calculate current streak
  const refWeek = getIsoWeekKey(referenceDate);
  const latestActiveWeek = sortedWeeks[sortedWeeks.length - 1];
  const diffFromRef = weekDiff(latestActiveWeek, refWeek);

  let currentStreak = 0;
  // Current streak is valid if the last active week is either this week (diff=0) or last week (diff=1)
  if (diffFromRef === 0 || diffFromRef === 1) {
    currentStreak = 1;
    for (let i = sortedWeeks.length - 1; i > 0; i--) {
      const diff = weekDiff(sortedWeeks[i - 1], sortedWeeks[i]);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalActiveWeeks,
    lastContributionDate: lastEvent.date,
    activeWeeksHistory: sortedWeeks,
  };
}

/**
 * Generates an activity heatmap for the last N weeks (e.g. 12 or 16 weeks).
 * Visualises consistency of participation, NOT sheer waste mass.
 */
export function generateContributionCalendar(
  events: ContributionEvent[],
  weeksCount: number = 12,
  referenceDate: Date = new Date(),
): WeeklyHeatmapCell[] {
  const currentWeekKey = getIsoWeekKey(referenceDate);
  const currentWeekStart = getIsoWeekStartDate(currentWeekKey);

  const weeks: WeeklyHeatmapCell[] = [];

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart.getTime() - i * 7 * 86400000);
    const isoWeek = getIsoWeekKey(weekStart);

    // Format weekLabel e.g. "18 Aug"
    const month = weekStart.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const day = weekStart.getUTCDate();
    const weekLabel = `${day} ${month}`;

    // Find events falling into this ISO week
    const weekEvents = events.filter((e) => getIsoWeekKey(e.date) === isoWeek);
    const eligibleWeekEvents = weekEvents.filter(
      (e) => e.acceptedMassKg > 0 && e.decision !== "REJECTED",
    );

    const count = eligibleWeekEvents.length;
    const acceptedMass = eligibleWeekEvents.reduce((s, e) => s + e.acceptedMassKg, 0);
    const grossMass = weekEvents.reduce((s, e) => s + e.grossMassKg, 0);
    const avgAcceptance = grossMass > 0 ? (acceptedMass / grossMass) * 100 : 0;

    // Intensity scale 0-4 based on consistency and quality, not massive volume
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (count === 0) intensity = 0;
    else if (count === 1 && avgAcceptance >= 90) intensity = 2;
    else if (count === 1) intensity = 1;
    else if (count >= 2 && avgAcceptance >= 92) intensity = 4;
    else intensity = 3;

    weeks.push({
      isoWeek,
      weekStart: weekStart.toISOString(),
      weekLabel,
      contributionCount: count,
      acceptedMassKg: Number(acceptedMass.toFixed(1)),
      grossMassKg: Number(grossMass.toFixed(1)),
      averageAcceptanceRate: Number(avgAcceptance.toFixed(1)),
      intensity,
    });
  }

  return weeks;
}

/**
 * Calculates the transparent, balanced ORBIT Recognition Score (0-100).
 * IMPORTANT: This is a partner motivation & recognition index, NOT an environmental measurement.
 * It purposefully avoids rewarding massive waste creation.
 *
 * Weightings:
 * - Quality Component (35%): Based on acceptance rate (low contamination).
 * - Consistency Component (30%): Based on weekly streak longevity.
 * - Verified Impact Component (25%): Based on conversion into biogas & closed loop.
 * - Participation Longevity (10%): Based on active weeks.
 */
export function calculateOrbitRecognitionScore(params: {
  acceptanceRate: number; // 0-100
  currentStreak: number;
  longestStreak: number;
  totalActiveWeeks: number;
  acceptedMassKg: number;
  traceableGasM3: number;
  hasConversion: boolean;
  hasFulfilment: boolean;
}): number {
  const {
    acceptanceRate,
    currentStreak,
    longestStreak,
    totalActiveWeeks,
    traceableGasM3,
    hasConversion,
    hasFulfilment,
  } = params;

  if (totalActiveWeeks === 0) return 0;

  // 1. Quality (0 to 35 pts)
  // 95%+ gets full points; drops steeply below 80%
  let qualityPoints = 0;
  if (acceptanceRate >= 95) qualityPoints = 35;
  else if (acceptanceRate >= 90) qualityPoints = 30 + ((acceptanceRate - 90) / 5) * 5;
  else if (acceptanceRate >= 80) qualityPoints = 18 + ((acceptanceRate - 80) / 10) * 12;
  else qualityPoints = Math.max(0, (acceptanceRate / 80) * 18);

  // 2. Consistency (0 to 30 pts)
  // 8+ weeks streak is top tier consistency
  const effectiveStreak = Math.max(currentStreak, longestStreak * 0.85);
  const consistencyPoints = Math.min(30, (effectiveStreak / 8) * 30);

  // 3. Verified Impact & Circularity (0 to 25 pts)
  // Has completed conversion cycle + allocation/fulfilment + biogas
  let impactPoints = 0;
  if (hasConversion) impactPoints += 10;
  if (hasFulfilment) impactPoints += 7;
  if (traceableGasM3 > 0) {
    impactPoints += Math.min(8, (traceableGasM3 / 10) * 8);
  }

  // 4. Participation Longevity (0 to 10 pts)
  const longevityPoints = Math.min(10, (totalActiveWeeks / 12) * 10);

  const total = qualityPoints + consistencyPoints + impactPoints + longevityPoints;
  return Math.min(100, Math.round(total));
}

/**
 * Evaluates all rule-based Partner Achievements deterministically.
 */
export function evaluatePartnerAchievements(params: {
  events: ContributionEvent[];
  streak: StreakStats;
  totalAcceptedKg: number;
  overallAcceptanceRate: number;
  inspectedBatchesCount: number;
  hasVerifiedConversion: boolean;
  hasEnergyFulfilled: boolean;
  isFounding: boolean;
}): PartnerAchievement[] {
  const {
    events,
    streak,
    totalAcceptedKg,
    overallAcceptanceRate,
    inspectedBatchesCount: _inspectedBatchesCount,
    hasVerifiedConversion,
    hasEnergyFulfilled,
    isFounding,
  } = params;

  // Filter eligible accepted events sorted chronologically
  const eligibleEvents = events
    .filter((e) => e.acceptedMassKg > 0 && e.decision !== "REJECTED")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const firstEligible = eligibleEvents[0];

  const badges: PartnerAchievement[] = [
    {
      key: "first_contribution",
      title: "First Contribution",
      description: "Completed the first verified accepted organic waste delivery.",
      category: "MILESTONE",
      iconName: "Sprout",
      unlocked: eligibleEvents.length >= 1,
      unlockedAt: firstEligible ? firstEligible.date.toISOString() : null,
      progress: eligibleEvents.length >= 1 ? 100 : 0,
      criteriaLabel: "1 verified batch",
    },
    {
      key: "clean_start",
      title: "Clean Start",
      description: "First verified contribution achieved ≥95% acceptance rate at source inspection.",
      category: "QUALITY",
      iconName: "Sparkles",
      unlocked: Boolean(firstEligible && (100 - firstEligible.contaminationRate) >= 95),
      unlockedAt:
        firstEligible && (100 - firstEligible.contaminationRate) >= 95
          ? firstEligible.date.toISOString()
          : null,
      progress:
        firstEligible && (100 - firstEligible.contaminationRate) >= 95
          ? 100
          : firstEligible
            ? Math.round(Math.min(100, ((100 - firstEligible.contaminationRate) / 95) * 100))
            : 0,
      criteriaLabel: "≥95% acceptance on 1st batch",
    },
    {
      key: "clean_feedstock",
      title: "Clean Feedstock",
      description: "Maintained ≥95% overall acceptance rate across at least 50 kg inspected mass.",
      category: "QUALITY",
      iconName: "ShieldCheck",
      unlocked: totalAcceptedKg >= 50 && overallAcceptanceRate >= 95,
      unlockedAt:
        totalAcceptedKg >= 50 && overallAcceptanceRate >= 95 && eligibleEvents.length > 0
          ? eligibleEvents[eligibleEvents.length - 1].date.toISOString()
          : null,
      progress: Math.min(
        100,
        Math.round((Math.min(totalAcceptedKg / 50, 1) * 0.5 + Math.min(overallAcceptanceRate / 95, 1) * 0.5) * 100),
      ),
      criteriaLabel: "≥95% acceptance over ≥50 kg",
    },
    {
      key: "consistency_1",
      title: "Consistency I",
      description: "Achieved a 4-week active weekly contribution streak.",
      category: "CONSISTENCY",
      iconName: "Flame",
      unlocked: streak.longestStreak >= 4,
      unlockedAt:
        streak.longestStreak >= 4 && eligibleEvents.length >= 4
          ? eligibleEvents[3]?.date.toISOString() ?? null
          : null,
      progress: Math.min(100, Math.round((streak.longestStreak / 4) * 100)),
      criteriaLabel: "4 consecutive weeks",
    },
    {
      key: "consistency_2",
      title: "Consistency II",
      description: "Maintained an 8-week active weekly contribution streak.",
      category: "CONSISTENCY",
      iconName: "FlameKindling",
      unlocked: streak.longestStreak >= 8,
      unlockedAt:
        streak.longestStreak >= 8 && eligibleEvents.length >= 8
          ? eligibleEvents[7]?.date.toISOString() ?? null
          : null,
      progress: Math.min(100, Math.round((streak.longestStreak / 8) * 100)),
      criteriaLabel: "8 consecutive weeks",
    },
    {
      key: "consistency_3",
      title: "Consistency III",
      description: "Sustained a 12-week active weekly contribution streak.",
      category: "CONSISTENCY",
      iconName: "Trophy",
      unlocked: streak.longestStreak >= 12,
      unlockedAt:
        streak.longestStreak >= 12 && eligibleEvents.length >= 12
          ? eligibleEvents[11]?.date.toISOString() ?? null
          : null,
      progress: Math.min(100, Math.round((streak.longestStreak / 12) * 100)),
      criteriaLabel: "12 consecutive weeks",
    },
    {
      key: "circular_contributor",
      title: "Circular Contributor",
      description: "Diverted and verified over 100 kg of accepted organic waste from landfills.",
      category: "MILESTONE",
      iconName: "Recycle",
      unlocked: totalAcceptedKg >= 100,
      unlockedAt:
        totalAcceptedKg >= 100 && eligibleEvents.length > 0
          ? eligibleEvents[eligibleEvents.length - 1].date.toISOString()
          : null,
      progress: Math.min(100, Math.round((totalAcceptedKg / 100) * 100)),
      criteriaLabel: "≥100 kg accepted organics",
    },
    {
      key: "quality_champion",
      title: "Quality Champion",
      description: "Inspected contamination rate maintained below 3% across ≥75 kg verified mass.",
      category: "QUALITY",
      iconName: "Award",
      unlocked: totalAcceptedKg >= 75 && overallAcceptanceRate >= 97,
      unlockedAt:
        totalAcceptedKg >= 75 && overallAcceptanceRate >= 97 && eligibleEvents.length > 0
          ? eligibleEvents[eligibleEvents.length - 1].date.toISOString()
          : null,
      progress: Math.min(
        100,
        Math.round((Math.min(totalAcceptedKg / 75, 1) * 0.5 + Math.min(overallAcceptanceRate / 97, 1) * 0.5) * 100),
      ),
      criteriaLabel: "≤3% contamination over ≥75 kg",
    },
    {
      key: "bioenergy_contributor",
      title: "Bioenergy Contributor",
      description: "Waste batches converted into verified biogas in an active anaerobic digestion cycle.",
      category: "TRACEABILITY",
      iconName: "Zap",
      unlocked: hasVerifiedConversion,
      unlockedAt: hasVerifiedConversion && eligibleEvents.length > 0 ? eligibleEvents[0].date.toISOString() : null,
      progress: hasVerifiedConversion ? 100 : 0,
      criteriaLabel: "Batch converted to biogas",
    },
    {
      key: "energy_returned",
      title: "Energy Returned",
      description: "Clean energy benefit allocated and fulfilled back to the community / school.",
      category: "TRACEABILITY",
      iconName: "CheckCircle2",
      unlocked: hasEnergyFulfilled,
      unlockedAt: hasEnergyFulfilled && eligibleEvents.length > 0 ? eligibleEvents[0].date.toISOString() : null,
      progress: hasEnergyFulfilled ? 100 : 0,
      criteriaLabel: "Fulfilled energy benefit",
    },
    {
      key: "founding_partner",
      title: "Founding Partner",
      description: "Recognized as an early pilot pioneer in the ORBIT circular bioenergy network.",
      category: "PILOT",
      iconName: "Building2",
      unlocked: isFounding,
      unlockedAt: isFounding && eligibleEvents.length > 0 ? eligibleEvents[0].date.toISOString() : null,
      progress: isFounding ? 100 : 0,
      criteriaLabel: "ORBIT Pilot Pioneer",
    },
  ];

  return badges;
}
