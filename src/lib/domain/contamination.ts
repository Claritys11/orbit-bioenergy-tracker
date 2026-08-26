import type { ContaminationInput, ContaminationResult } from "./types";

const round = (value: number, digits = 4) =>
  Number(Math.max(0, value).toFixed(digits));

export function calculateContamination(input: ContaminationInput): ContaminationResult {
  if (input.verifiedGrossMassKg <= 0) {
    throw new Error("Verified gross mass must be greater than zero.");
  }

  if (input.rejectedMassKg < 0 || input.rejectedMassKg > input.verifiedGrossMassKg) {
    throw new Error("Rejected mass must be between zero and verified gross mass.");
  }

  const contaminationRate = round(
    (input.rejectedMassKg / input.verifiedGrossMassKg) * 100,
    2,
  );
  const acceptedMassKg = round(input.verifiedGrossMassKg - input.rejectedMassKg, 3);

  if (acceptedMassKg === 0 || contaminationRate >= input.rejectThresholdPercent) {
    return {
      contaminationRate,
      acceptedMassKg: 0,
      qualityFactor: 0,
      decision: "REJECTED",
    };
  }

  const qualityFactor = round(
    Math.max(0, 1 - contaminationRate / input.rejectThresholdPercent),
    4,
  );

  return {
    contaminationRate,
    acceptedMassKg,
    qualityFactor,
    decision:
      contaminationRate >= input.warningThresholdPercent ? "CONDITIONAL" : "ACCEPTED",
  };
}
