import type {
  AllocationInput,
  AllocationPool,
  AllocationResult,
  ContributionInput,
  ContributionResult,
} from "./types";

const round = (value: number, digits = 4) => Number(value.toFixed(digits));

export function calculateContribution(input: ContributionInput): ContributionResult {
  if (input.acceptedMassKg < 0) throw new Error("Accepted mass cannot be negative.");
  if (input.yieldFactor < 0 || input.qualityFactor < 0 || input.conditionFactor < 0) {
    throw new Error("Contribution factors cannot be negative.");
  }

  if (input.rejected || input.acceptedMassKg === 0) {
    return {
      ...input,
      acceptedMassKg: 0,
      qualityFactor: 0,
      contributionScore: 0,
      estimatedGasM3: 0,
    };
  }

  return {
    ...input,
    contributionScore: round(
      input.acceptedMassKg *
        input.yieldFactor *
        input.qualityFactor *
        input.conditionFactor,
    ),
    estimatedGasM3: round(input.acceptedMassKg * input.yieldFactor * input.conditionFactor),
  };
}

export function validateAllocationConfig(config: AllocationInput["config"]) {
  const total = config.schoolPercent + config.operatorPercent + config.contributorPercent;
  if (Math.abs(total - 100) > 0.0001) throw new Error("Allocation percentages must total 100.");
  if (config.schoolPercent <= config.operatorPercent) {
    throw new Error("The school pool must remain the largest pool.");
  }
  if (config.contributorPercent > config.schoolPercent) {
    throw new Error("Supporting contributors cannot receive more than schools.");
  }
}

export function calculateAllocations(input: AllocationInput): AllocationResult {
  validateAllocationConfig(input.config);

  const allocatableGasM3 = round(
    Math.max(0, input.verifiedGasM3 - input.operationalUseM3 - input.safetyReserveM3),
  );

  const basePools: Record<AllocationPool, number> = {
    schools: round((allocatableGasM3 * input.config.schoolPercent) / 100),
    operator: round((allocatableGasM3 * input.config.operatorPercent) / 100),
    contributors: round((allocatableGasM3 * input.config.contributorPercent) / 100),
  };

  const totals = input.contributions.reduce<Record<AllocationPool, number>>(
    (acc, contribution) => {
      acc[contribution.pool] += contribution.contributionScore;
      return acc;
    },
    { schools: 0, operator: 0, contributors: 0 },
  );

  const pools = { ...basePools };
  if (totals.contributors === 0 && pools.contributors > 0) {
    pools.schools = round(pools.schools + pools.contributors);
    pools.contributors = 0;
  }
  if (totals.schools === 0 && pools.schools > 0) {
    pools.operator = round(pools.operator + pools.schools);
    pools.schools = 0;
  }

  const byOrg = new Map<string, { organisationId: string; pool: AllocationPool; scoreBasis: number }>();
  for (const contribution of input.contributions) {
    const key = `${contribution.pool}:${contribution.organisationId}`;
    const existing = byOrg.get(key);
    byOrg.set(key, {
      organisationId: contribution.organisationId,
      pool: contribution.pool,
      scoreBasis: round((existing?.scoreBasis ?? 0) + contribution.contributionScore),
    });
  }

  const allocations = Array.from(byOrg.values()).map((entry) => {
    const totalScore = totals[entry.pool];
    return {
      ...entry,
      allocatedGasM3:
        totalScore > 0 ? round((pools[entry.pool] * entry.scoreBasis) / totalScore) : 0,
    };
  });

  return { allocatableGasM3, pools, allocations };
}
