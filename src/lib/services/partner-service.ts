import type { OrganisationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  calculateOrbitRecognitionScore,
  calculateWeeklyStreak,
  evaluatePartnerAchievements,
  generateContributionCalendar,
  type ContributionEvent,
  type LeaderboardCategory,
  type LeaderboardEntry,
  type PartnerAchievement,
  type PartnerRecognitionMetrics,
  type PartnerSummary,
  type StreakStats,
  type WeeklyHeatmapCell,
} from "@/lib/domain/partner-recognition";

export interface NetworkHighlight {
  role: "MOST_IMPACTFUL" | "BEST_QUALITY" | "MOST_CONSISTENT" | "RISING_CONTRIBUTOR";
  title: string;
  badgeTone: string;
  partner: PartnerSummary;
  headline: string;
  subtext: string;
}

export interface NetworkOverview {
  totalPartners: number;
  totalSchools: number;
  totalOperators: number;
  totalSupporting: number;
  totalVerifiedOrganicsKg: number;
  totalTraceableGasM3: number;
  confidence: "Simulated Demo" | "Measured";
}

export interface PublicPartnerNetworkData {
  overview: NetworkOverview;
  highlights: NetworkHighlight[];
  partners: PartnerSummary[];
  leaderboard: Record<LeaderboardCategory, LeaderboardEntry[]>;
}

export interface PublicPartnerProfileData {
  partner: PartnerSummary;
  streak: StreakStats;
  metrics: PartnerRecognitionMetrics;
  achievements: PartnerAchievement[];
  heatmap: WeeklyHeatmapCell[];
  recentActivity: Array<{
    id: string;
    date: string;
    title: string;
    details: string;
    badgeTone: string;
    qrToken?: string;
    batchCode?: string;
  }>;
  circularImpact: {
    percentOfNetworkAccepted: number;
    traceableConversionCycles: number;
    traceableGasM3: number;
    fulfilledEnergyBenefitM3: number;
  };
  confidence: "Simulated Demo" | "Measured";
}

function extractCity(address: string | null): string {
  if (!address) return "Indonesia";
  const parts = address.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || "Indonesia";
}

export async function getPublicPartnerNetwork(filterType?: string): Promise<PublicPartnerNetworkData> {
  const allowedTypes: OrganisationType[] = [
    "SCHOOL",
    "OPERATOR",
    "SUPPORTING_CONTRIBUTOR",
    "COMMUNITY_PARTNER",
  ];

  const orgs = await prisma.organisation.findMany({
    where: { type: { in: allowedTypes } },
    include: {
      facility: true,
      school: true,
      contributor: true,
      batches: {
        include: {
          inspection: true,
          category: true,
          conversionBatches: { include: { cycle: true } },
          contributionScores: true,
        },
        orderBy: { collectionTimestamp: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch all allocations to calculate energy benefits
  const allAllocations = await prisma.energyAllocation.findMany({
    include: { fulfilments: true },
  });

  const partnerSummaries: PartnerSummary[] = orgs.map((org) => {
    const events: ContributionEvent[] = org.batches.flatMap((b) => {
      if (!b.inspection) return [];
      return [
        {
          date: b.collectionTimestamp,
          grossMassKg: b.grossWeightKg ?? b.inspection.verifiedGrossMassKg ?? 0,
          acceptedMassKg: b.inspection.acceptedMassKg,
          rejectedMassKg: b.inspection.rejectedMassKg,
          decision: b.inspection.decision,
          contaminationRate: b.inspection.contaminationRate,
          batchCode: b.batchCode,
          qrToken: b.qrToken,
          categoryName: b.category.name,
        },
      ];
    });

    const eligibleEvents = events.filter((e) => e.acceptedMassKg > 0 && e.decision !== "REJECTED");
    const streak = calculateWeeklyStreak(events);

    const grossMassKg = events.reduce((sum, e) => sum + e.grossMassKg, 0);
    const acceptedMassKg = eligibleEvents.reduce((sum, e) => sum + e.acceptedMassKg, 0);
    const rejectedMassKg = events.reduce((sum, e) => sum + e.rejectedMassKg, 0);
    const inspectedMass = acceptedMassKg + rejectedMassKg;
    const acceptanceRate = inspectedMass > 0 ? Number(((acceptedMassKg / inspectedMass) * 100).toFixed(1)) : 0;

    // Biogas attribution
    const orgScores = org.batches.flatMap((b) => b.contributionScores);
    const hasConversion = org.batches.some((b) => b.conversionBatches.length > 0);
    const traceableGasM3 = Number(orgScores.reduce((sum, s) => sum + s.estimatedGasM3, 0).toFixed(2));

    const orgAllocations = allAllocations.filter((a) => a.recipientOrgId === org.id);
    const allocatedGasM3 = Number(orgAllocations.reduce((sum, a) => sum + a.allocatedGasM3, 0).toFixed(2));
    const fulfilledGasM3 = Number(
      orgAllocations
        .flatMap((a) => a.fulfilments)
        .reduce((sum, f) => sum + f.volumeM3, 0)
        .toFixed(2),
    );
    const hasFulfilment = fulfilledGasM3 > 0;

    const isFounding =
      org.facility?.biodigesterStatus === "PILOT_PARTNER" ||
      org.slug === "bumi-lestari" ||
      org.slug === "smk-telkom-malang" ||
      org.slug === "ksm-energi-sirkular";

    const orbitRecognitionScore = calculateOrbitRecognitionScore({
      acceptanceRate,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalActiveWeeks: streak.totalActiveWeeks,
      acceptedMassKg,
      traceableGasM3,
      hasConversion,
      hasFulfilment,
    });

    const metrics: PartnerRecognitionMetrics = {
      acceptedMassKg: Number(acceptedMassKg.toFixed(1)),
      grossMassKg: Number(grossMassKg.toFixed(1)),
      rejectedMassKg: Number(rejectedMassKg.toFixed(1)),
      acceptanceRate,
      totalBatches: org.batches.length,
      verifiedBatches: eligibleEvents.length,
      streak,
      traceableGasM3,
      allocatedGasM3,
      fulfilledGasM3,
      orbitRecognitionScore,
    };

    const achievements = evaluatePartnerAchievements({
      events,
      streak,
      totalAcceptedKg: acceptedMassKg,
      overallAcceptanceRate: acceptanceRate,
      inspectedBatchesCount: events.length,
      hasVerifiedConversion: hasConversion,
      hasEnergyFulfilled: hasFulfilment,
      isFounding,
    });

    let statusLabel = "Participating Partner";
    if (org.facility?.biodigesterStatus === "PILOT_PARTNER") {
      statusLabel = "Pilot Conversion Hub";
    } else if (org.type === "SCHOOL") {
      statusLabel = "Participating School";
    } else if (org.type === "SUPPORTING_CONTRIBUTOR") {
      statusLabel = "Feedstock Stabilizer";
    } else if (org.type === "COMMUNITY_PARTNER") {
      statusLabel = "Community Monitoring Partner";
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      statusLabel,
      city: extractCity(org.address),
      joinedAt: org.createdAt,
      metrics,
      topAchievements: achievements.filter((a) => a.unlocked).slice(0, 3),
      isFounding,
    };
  });

  // Filter if specific type requested
  const filteredPartners =
    filterType && filterType !== "ALL"
      ? partnerSummaries.filter((p) => p.type === filterType)
      : partnerSummaries;

  // Build Leaderboard entries across categories
  const buildLeaderboard = (
    category: LeaderboardCategory,
    sorter: (a: PartnerSummary, b: PartnerSummary) => number,
    formatter: (p: PartnerSummary) => { primary: string; label: string; secondary: string },
    filterEligible?: (p: PartnerSummary) => boolean,
  ): LeaderboardEntry[] => {
    const list = filterEligible ? partnerSummaries.filter(filterEligible) : [...partnerSummaries];
    list.sort(sorter);
    return list.map((partner, index) => {
      const { primary, label, secondary } = formatter(partner);
      return {
        rank: index + 1,
        partner,
        primaryValue: primary,
        primaryMetricLabel: label,
        secondaryValue: secondary,
      };
    });
  };

  const leaderboard: Record<LeaderboardCategory, LeaderboardEntry[]> = {
    overall: buildLeaderboard(
      "overall",
      (a, b) => b.metrics.orbitRecognitionScore - a.metrics.orbitRecognitionScore,
      (p) => ({
        primary: `${p.metrics.orbitRecognitionScore} pts`,
        label: "Recognition Score",
        secondary: `${p.metrics.streak.currentStreak} wk streak · ${p.metrics.acceptanceRate}% quality`,
      }),
      (p) => p.metrics.totalBatches > 0,
    ),
    diverted: buildLeaderboard(
      "diverted",
      (a, b) => b.metrics.acceptedMassKg - a.metrics.acceptedMassKg,
      (p) => ({
        primary: `${p.metrics.acceptedMassKg.toFixed(1)} kg`,
        label: "Accepted Organics",
        secondary: `${p.metrics.verifiedBatches} verified batches · ${p.metrics.acceptanceRate}% acceptance`,
      }),
      (p) => p.metrics.acceptedMassKg > 0,
    ),
    quality: buildLeaderboard(
      "quality",
      (a, b) => {
        // High quality with at least 20kg prioritized
        if (b.metrics.acceptanceRate !== a.metrics.acceptanceRate) {
          return b.metrics.acceptanceRate - a.metrics.acceptanceRate;
        }
        return b.metrics.acceptedMassKg - a.metrics.acceptedMassKg;
      },
      (p) => ({
        primary: `${p.metrics.acceptanceRate}%`,
        label: "Acceptance Rate",
        secondary: `${p.metrics.acceptedMassKg.toFixed(1)} kg inspected · ${p.metrics.verifiedBatches} batches`,
      }),
      (p) => p.metrics.acceptedMassKg >= 15, // minimum sample guardrail
    ),
    consistency: buildLeaderboard(
      "consistency",
      (a, b) => {
        if (b.metrics.streak.longestStreak !== a.metrics.streak.longestStreak) {
          return b.metrics.streak.longestStreak - a.metrics.streak.longestStreak;
        }
        return b.metrics.streak.totalActiveWeeks - a.metrics.streak.totalActiveWeeks;
      },
      (p) => ({
        primary: `${p.metrics.streak.longestStreak} weeks`,
        label: "Longest Streak",
        secondary: `${p.metrics.streak.currentStreak} wk active streak · ${p.metrics.streak.totalActiveWeeks} total weeks`,
      }),
      (p) => p.metrics.streak.totalActiveWeeks > 0,
    ),
    energy: buildLeaderboard(
      "energy",
      (a, b) => b.metrics.traceableGasM3 + b.metrics.allocatedGasM3 - (a.metrics.traceableGasM3 + a.metrics.allocatedGasM3),
      (p) => ({
        primary: `${(p.metrics.traceableGasM3 || p.metrics.allocatedGasM3).toFixed(2)} m³`,
        label: "Biogas Impact",
        secondary: p.type === "OPERATOR" ? "Facility output" : `${p.metrics.fulfilledGasM3.toFixed(2)} m³ fulfilled benefit`,
      }),
      (p) => p.metrics.traceableGasM3 > 0 || p.metrics.allocatedGasM3 > 0,
    ),
  };

  // Highlights (Calculated deterministically)
  const highlights: NetworkHighlight[] = [];

  // 1. Most Impactful (highest verified accepted kg)
  const mostImpactful = [...partnerSummaries].sort((a, b) => b.metrics.acceptedMassKg - a.metrics.acceptedMassKg)[0];
  if (mostImpactful && mostImpactful.metrics.acceptedMassKg > 0) {
    highlights.push({
      role: "MOST_IMPACTFUL",
      title: "Most Impactful Contributor",
      badgeTone: "green",
      partner: mostImpactful,
      headline: `${mostImpactful.metrics.acceptedMassKg.toFixed(1)} kg Verified Organics`,
      subtext: `Diverted across ${mostImpactful.metrics.verifiedBatches} verified batches with ${mostImpactful.metrics.acceptanceRate}% acceptance.`,
    });
  }

  // 2. Best Feedstock Quality (highest acceptance rate with ≥20 kg sample)
  const bestQuality = [...partnerSummaries]
    .filter((p) => p.metrics.acceptedMassKg >= 20)
    .sort((a, b) => b.metrics.acceptanceRate - a.metrics.acceptanceRate || b.metrics.acceptedMassKg - a.metrics.acceptedMassKg)[0];
  if (bestQuality) {
    highlights.push({
      role: "BEST_QUALITY",
      title: "Best Feedstock Quality",
      badgeTone: "purple",
      partner: bestQuality,
      headline: `${bestQuality.metrics.acceptanceRate}% Feedstock Acceptance`,
      subtext: `Exceptionally low contamination across ${bestQuality.metrics.acceptedMassKg.toFixed(1)} kg verified load.`,
    });
  }

  // 3. Most Consistent (longest active streak)
  const mostConsistent = [...partnerSummaries].sort(
    (a, b) => b.metrics.streak.longestStreak - a.metrics.streak.longestStreak || b.metrics.streak.totalActiveWeeks - a.metrics.streak.totalActiveWeeks,
  )[0];
  if (mostConsistent && mostConsistent.metrics.streak.longestStreak > 0) {
    highlights.push({
      role: "MOST_CONSISTENT",
      title: "Most Consistent Contributor",
      badgeTone: "amber",
      partner: mostConsistent,
      headline: `${mostConsistent.metrics.streak.longestStreak} Week Weekly Streak`,
      subtext: `Reliable source separation recorded across ${mostConsistent.metrics.streak.totalActiveWeeks} total active weeks.`,
    });
  }

  // 4. Rising Contributor (highest recognition score among contributors)
  const rising = [...partnerSummaries]
    .filter((p) => p.id !== mostImpactful?.id && p.metrics.totalBatches > 0)
    .sort((a, b) => b.metrics.orbitRecognitionScore - a.metrics.orbitRecognitionScore)[0];
  if (rising) {
    highlights.push({
      role: "RISING_CONTRIBUTOR",
      title: "High Recognition Pioneer",
      badgeTone: "blue",
      partner: rising,
      headline: `${rising.metrics.orbitRecognitionScore} Recognition Index`,
      subtext: `Active sorting discipline with ${rising.metrics.streak.currentStreak} wk streak and clean verification.`,
    });
  }

  // Network Overview
  const totalVerifiedOrganicsKg = Number(
    partnerSummaries.reduce((sum, p) => sum + p.metrics.acceptedMassKg, 0).toFixed(1),
  );
  const totalTraceableGasM3 = Number(
    partnerSummaries.reduce((sum, p) => sum + p.metrics.traceableGasM3, 0).toFixed(2),
  );

  const overview: NetworkOverview = {
    totalPartners: partnerSummaries.length,
    totalSchools: partnerSummaries.filter((p) => p.type === "SCHOOL").length,
    totalOperators: partnerSummaries.filter((p) => p.type === "OPERATOR").length,
    totalSupporting: partnerSummaries.filter((p) => p.type === "SUPPORTING_CONTRIBUTOR").length,
    totalVerifiedOrganicsKg,
    totalTraceableGasM3,
    confidence: "Simulated Demo",
  };

  return {
    overview,
    highlights,
    partners: filteredPartners,
    leaderboard,
  };
}

export async function getPublicPartnerProfile(slug: string): Promise<PublicPartnerProfileData | null> {
  const org = await prisma.organisation.findUnique({
    where: { slug },
    include: {
      facility: true,
      school: true,
      contributor: true,
      batches: {
        include: {
          inspection: true,
          category: true,
          conversionBatches: { include: { cycle: true } },
          contributionScores: true,
        },
        orderBy: { collectionTimestamp: "desc" },
      },
    },
  });

  if (!org || org.type === "PLATFORM") {
    return null;
  }

  // Total network accepted waste for calculating % contribution
  const totalNetworkAcceptedAgg = await prisma.contaminationInspection.aggregate({
    _sum: { acceptedMassKg: true },
  });
  const totalNetworkAcceptedKg = totalNetworkAcceptedAgg._sum.acceptedMassKg ?? 1;

  // Fetch partner's energy allocations
  const allocations = await prisma.energyAllocation.findMany({
    where: { recipientOrgId: org.id },
    include: { fulfilments: true },
  });

  const events: ContributionEvent[] = org.batches.flatMap((b) => {
    if (!b.inspection) return [];
    return [
      {
        date: b.collectionTimestamp,
        grossMassKg: b.inspection.verifiedGrossMassKg ?? b.grossWeightKg ?? 0,
        acceptedMassKg: b.inspection.acceptedMassKg,
        rejectedMassKg: b.inspection.rejectedMassKg,
        decision: b.inspection.decision,
        contaminationRate: b.inspection.contaminationRate,
        batchCode: b.batchCode,
        qrToken: b.qrToken,
        categoryName: b.category.name,
      },
    ];
  });

  const eligibleEvents = events.filter((e) => e.acceptedMassKg > 0 && e.decision !== "REJECTED");
  const streak = calculateWeeklyStreak(events);

  const grossMassKg = events.reduce((sum, e) => sum + e.grossMassKg, 0);
  const acceptedMassKg = eligibleEvents.reduce((sum, e) => sum + e.acceptedMassKg, 0);
  const rejectedMassKg = events.reduce((sum, e) => sum + e.rejectedMassKg, 0);
  const inspectedMass = acceptedMassKg + rejectedMassKg;
  const acceptanceRate = inspectedMass > 0 ? Number(((acceptedMassKg / inspectedMass) * 100).toFixed(1)) : 0;

  const orgScores = org.batches.flatMap((b) => b.contributionScores);
  const hasConversion = org.batches.some((b) => b.conversionBatches.length > 0);
  const traceableGasM3 = Number(orgScores.reduce((sum, s) => sum + s.estimatedGasM3, 0).toFixed(2));

  const allocatedGasM3 = Number(allocations.reduce((sum, a) => sum + a.allocatedGasM3, 0).toFixed(2));
  const fulfilledGasM3 = Number(
    allocations
      .flatMap((a) => a.fulfilments)
      .reduce((sum, f) => sum + f.volumeM3, 0)
      .toFixed(2),
  );
  const hasFulfilment = fulfilledGasM3 > 0;

  const isFounding =
    org.facility?.biodigesterStatus === "PILOT_PARTNER" ||
    org.slug === "bumi-lestari" ||
    org.slug === "smk-telkom-malang" ||
    org.slug === "ksm-energi-sirkular";

  const orbitRecognitionScore = calculateOrbitRecognitionScore({
    acceptanceRate,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalActiveWeeks: streak.totalActiveWeeks,
    acceptedMassKg,
    traceableGasM3,
    hasConversion,
    hasFulfilment,
  });

  const metrics: PartnerRecognitionMetrics = {
    acceptedMassKg: Number(acceptedMassKg.toFixed(1)),
    grossMassKg: Number(grossMassKg.toFixed(1)),
    rejectedMassKg: Number(rejectedMassKg.toFixed(1)),
    acceptanceRate,
    totalBatches: org.batches.length,
    verifiedBatches: eligibleEvents.length,
    streak,
    traceableGasM3,
    allocatedGasM3,
    fulfilledGasM3,
    orbitRecognitionScore,
  };

  const achievements = evaluatePartnerAchievements({
    events,
    streak,
    totalAcceptedKg: acceptedMassKg,
    overallAcceptanceRate: acceptanceRate,
    inspectedBatchesCount: events.length,
    hasVerifiedConversion: hasConversion,
    hasEnergyFulfilled: hasFulfilment,
    isFounding,
  });

  const heatmap = generateContributionCalendar(events, 12);

  // Build sanitized public-safe recent activity timeline
  const recentActivity = org.batches.slice(0, 10).map((b) => {
    const inspected = b.inspection;
    let title = `Organic Batch ${b.batchCode}`;
    let details = `${b.category.name} · ${b.grossWeightKg ? `${b.grossWeightKg.toFixed(1)} kg gross` : "Pending verification"}`;
    let badgeTone = "slate";

    if (inspected) {
      if (inspected.decision === "ACCEPTED") {
        title = `Batch Verified: ${inspected.acceptedMassKg.toFixed(1)} kg Accepted`;
        details = `Clean feedstock (${inspected.contaminationRate.toFixed(1)}% contamination) · ${b.category.name}`;
        badgeTone = "green";
      } else if (inspected.decision === "CONDITIONAL") {
        title = `Batch Conditionally Verified`;
        details = `${inspected.acceptedMassKg.toFixed(1)} kg accepted (${inspected.contaminationRate.toFixed(1)}% contamination)`;
        badgeTone = "amber";
      } else {
        title = `Batch Rejected at Inspection`;
        details = `Heavily contaminated (${inspected.contaminationRate.toFixed(1)}%) — zero eligible contribution`;
        badgeTone = "red";
      }
    } else {
      title = `Waste Batch Registered`;
      details = b.grossWeightKg ? `${b.grossWeightKg.toFixed(1)} kg pending verification` : "Pending facility verification";
      badgeTone = "blue";
    }

    return {
      id: b.id,
      date: b.collectionTimestamp.toISOString(),
      title,
      details,
      badgeTone,
      qrToken: b.qrToken,
      batchCode: b.batchCode,
    };
  });

  let statusLabel = "Participating Partner";
  if (org.facility?.biodigesterStatus === "PILOT_PARTNER") {
    statusLabel = "Pilot Conversion Hub";
  } else if (org.type === "SCHOOL") {
    statusLabel = "Participating School";
  } else if (org.type === "SUPPORTING_CONTRIBUTOR") {
    statusLabel = "Feedstock Stabilizer";
  } else if (org.type === "COMMUNITY_PARTNER") {
    statusLabel = "Community Monitoring Partner";
  }

  const partner: PartnerSummary = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    statusLabel,
    city: extractCity(org.address),
    joinedAt: org.createdAt,
    metrics,
    topAchievements: achievements.filter((a) => a.unlocked).slice(0, 3),
    isFounding,
  };

  const percentOfNetworkAccepted =
    totalNetworkAcceptedKg > 0
      ? Number(((acceptedMassKg / totalNetworkAcceptedKg) * 100).toFixed(1))
      : 0;

  const traceableConversionCycles = org.batches.reduce(
    (acc, b) => acc + b.conversionBatches.length,
    0,
  );

  return {
    partner,
    streak,
    metrics,
    achievements,
    heatmap,
    recentActivity,
    circularImpact: {
      percentOfNetworkAccepted,
      traceableConversionCycles,
      traceableGasM3,
      fulfilledEnergyBenefitM3: fulfilledGasM3,
    },
    confidence: "Simulated Demo",
  };
}
