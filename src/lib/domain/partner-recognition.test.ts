import { describe, expect, it } from "vitest";
import {
  calculateOrbitRecognitionScore,
  calculateWeeklyStreak,
  evaluatePartnerAchievements,
  generateContributionCalendar,
  getIsoWeekKey,
  type ContributionEvent,
} from "./partner-recognition";

describe("ISO Week calculation", () => {
  it("formats dates correctly into ISO-8601 week keys", () => {
    // 2026-08-20 is Thursday of week 34
    const d1 = new Date("2026-08-20T10:00:00.000Z");
    expect(getIsoWeekKey(d1)).toBe("2026-W34");

    // 2026-08-24 is Monday of week 35
    const d2 = new Date("2026-08-24T08:00:00.000Z");
    expect(getIsoWeekKey(d2)).toBe("2026-W35");
  });
});

describe("Weekly Streak Calculation", () => {
  it("calculates active streak for consecutive weeks", () => {
    // 4 consecutive weeks: W31, W32, W33, W34
    const events: ContributionEvent[] = [
      {
        date: new Date("2026-08-01T10:00:00.000Z"), // W31 (Saturday)
        grossMassKg: 20,
        acceptedMassKg: 19,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 5,
      },
      {
        date: new Date("2026-08-05T10:00:00.000Z"), // W32 (Wednesday)
        grossMassKg: 25,
        acceptedMassKg: 24,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 4,
      },
      {
        date: new Date("2026-08-12T10:00:00.000Z"), // W33 (Wednesday)
        grossMassKg: 30,
        acceptedMassKg: 28,
        rejectedMassKg: 2,
        decision: "ACCEPTED",
        contaminationRate: 6.6,
      },
      {
        date: new Date("2026-08-19T10:00:00.000Z"), // W34 (Wednesday)
        grossMassKg: 22,
        acceptedMassKg: 21,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 4.5,
      },
    ];

    const refDate = new Date("2026-08-20T12:00:00.000Z"); // in W34
    const streak = calculateWeeklyStreak(events, refDate);

    expect(streak.currentStreak).toBe(4);
    expect(streak.longestStreak).toBe(4);
    expect(streak.totalActiveWeeks).toBe(4);
    expect(streak.lastContributionDate).toEqual(events[3].date);
  });

  it("breaks streak when a week is missed", () => {
    // Weeks: W30, W31, (missed W32), W33, W34
    const events: ContributionEvent[] = [
      {
        date: new Date("2026-07-22T10:00:00.000Z"), // W30
        grossMassKg: 15,
        acceptedMassKg: 14,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 6.6,
      },
      {
        date: new Date("2026-07-29T10:00:00.000Z"), // W31
        grossMassKg: 18,
        acceptedMassKg: 17,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 5.5,
      },
      // W32 skipped!
      {
        date: new Date("2026-08-12T10:00:00.000Z"), // W33
        grossMassKg: 20,
        acceptedMassKg: 19,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 5,
      },
      {
        date: new Date("2026-08-19T10:00:00.000Z"), // W34
        grossMassKg: 22,
        acceptedMassKg: 21,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 4.5,
      },
    ];

    const refDate = new Date("2026-08-20T12:00:00.000Z"); // in W34
    const streak = calculateWeeklyStreak(events, refDate);

    expect(streak.currentStreak).toBe(2); // Only W33 and W34
    expect(streak.longestStreak).toBe(2);
    expect(streak.totalActiveWeeks).toBe(4);
  });

  it("counts multiple contributions in the same ISO week as one active week", () => {
    // 3 batches in W34
    const events: ContributionEvent[] = [
      {
        date: new Date("2026-08-17T09:00:00.000Z"), // W34 Monday
        grossMassKg: 10,
        acceptedMassKg: 9.5,
        rejectedMassKg: 0.5,
        decision: "ACCEPTED",
        contaminationRate: 5,
      },
      {
        date: new Date("2026-08-19T10:00:00.000Z"), // W34 Wednesday
        grossMassKg: 12,
        acceptedMassKg: 11.5,
        rejectedMassKg: 0.5,
        decision: "ACCEPTED",
        contaminationRate: 4.1,
      },
      {
        date: new Date("2026-08-21T14:00:00.000Z"), // W34 Friday
        grossMassKg: 15,
        acceptedMassKg: 14,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 6.6,
      },
    ];

    const streak = calculateWeeklyStreak(events, new Date("2026-08-21T15:00:00.000Z"));
    expect(streak.currentStreak).toBe(1);
    expect(streak.totalActiveWeeks).toBe(1);
  });

  it("ignores rejected-only contributions for streak calculation", () => {
    const events: ContributionEvent[] = [
      {
        date: new Date("2026-08-12T10:00:00.000Z"), // W33: Accepted
        grossMassKg: 20,
        acceptedMassKg: 19,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 5,
      },
      {
        date: new Date("2026-08-19T10:00:00.000Z"), // W34: Heavily contaminated & REJECTED
        grossMassKg: 35,
        acceptedMassKg: 0,
        rejectedMassKg: 35,
        decision: "REJECTED",
        contaminationRate: 100,
      },
    ];

    // Reference date in W34: Because W34 was rejected, current active week is W33, so current streak remains 1 (W33)
    const streak = calculateWeeklyStreak(events, new Date("2026-08-20T12:00:00.000Z"));
    expect(streak.currentStreak).toBe(1);
    expect(streak.totalActiveWeeks).toBe(1);
  });
});

describe("Partner Achievements", () => {
  it("evaluates first contribution and quality badges correctly", () => {
    const events: ContributionEvent[] = [
      {
        date: new Date("2026-08-10T10:00:00.000Z"),
        grossMassKg: 20,
        acceptedMassKg: 19.5,
        rejectedMassKg: 0.5,
        decision: "ACCEPTED",
        contaminationRate: 2.5, // 97.5% acceptance
      },
    ];

    const streak = calculateWeeklyStreak(events, new Date("2026-08-10T12:00:00.000Z"));
    const badges = evaluatePartnerAchievements({
      events,
      streak,
      totalAcceptedKg: 19.5,
      overallAcceptanceRate: 97.5,
      inspectedBatchesCount: 1,
      hasVerifiedConversion: false,
      hasEnergyFulfilled: false,
      isFounding: true,
    });

    const firstBadge = badges.find((b) => b.key === "first_contribution");
    const cleanStartBadge = badges.find((b) => b.key === "clean_start");
    const cleanFeedstockBadge = badges.find((b) => b.key === "clean_feedstock");
    const foundingBadge = badges.find((b) => b.key === "founding_partner");

    expect(firstBadge?.unlocked).toBe(true);
    expect(cleanStartBadge?.unlocked).toBe(true);
    // Clean feedstock requires ≥50 kg
    expect(cleanFeedstockBadge?.unlocked).toBe(false);
    expect(foundingBadge?.unlocked).toBe(true);
  });

  it("does not unlock clean feedstock on low volume batches", () => {
    const events: ContributionEvent[] = [
      {
        date: new Date("2026-08-10T10:00:00.000Z"),
        grossMassKg: 5,
        acceptedMassKg: 5,
        rejectedMassKg: 0,
        decision: "ACCEPTED",
        contaminationRate: 0,
      },
    ];
    const streak = calculateWeeklyStreak(events);
    const badges = evaluatePartnerAchievements({
      events,
      streak,
      totalAcceptedKg: 5,
      overallAcceptanceRate: 100,
      inspectedBatchesCount: 1,
      hasVerifiedConversion: false,
      hasEnergyFulfilled: false,
      isFounding: false,
    });

    const cleanFeedstock = badges.find((b) => b.key === "clean_feedstock");
    expect(cleanFeedstock?.unlocked).toBe(false);
  });
});

describe("Contribution Calendar Heatmap", () => {
  it("generates 12 weeks of heatmap cells ending at current week", () => {
    const events: ContributionEvent[] = [
      {
        date: new Date("2026-08-20T10:00:00.000Z"),
        grossMassKg: 25,
        acceptedMassKg: 24,
        rejectedMassKg: 1,
        decision: "ACCEPTED",
        contaminationRate: 4,
      },
    ];

    const refDate = new Date("2026-08-20T12:00:00.000Z");
    const heatmap = generateContributionCalendar(events, 12, refDate);

    expect(heatmap.length).toBe(12);
    const lastCell = heatmap[heatmap.length - 1];
    expect(lastCell.isoWeek).toBe("2026-W34");
    expect(lastCell.contributionCount).toBe(1);
    expect(lastCell.acceptedMassKg).toBe(24);
    expect(lastCell.intensity).toBeGreaterThan(0);
  });
});

describe("ORBIT Recognition Score", () => {
  it("calculates high score for high quality, long streak, and closed-loop impact", () => {
    const score = calculateOrbitRecognitionScore({
      acceptanceRate: 98,
      currentStreak: 8,
      longestStreak: 8,
      totalActiveWeeks: 12,
      acceptedMassKg: 250,
      traceableGasM3: 15,
      hasConversion: true,
      hasFulfilment: true,
    });

    // Should score high in 90+ range
    expect(score).toBeGreaterThanOrEqual(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns 0 for zero participation", () => {
    const score = calculateOrbitRecognitionScore({
      acceptanceRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalActiveWeeks: 0,
      acceptedMassKg: 0,
      traceableGasM3: 0,
      hasConversion: false,
      hasFulfilment: false,
    });
    expect(score).toBe(0);
  });
});
