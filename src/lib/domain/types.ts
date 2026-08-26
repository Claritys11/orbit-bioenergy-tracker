export type Role =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "CANTEEN_STAFF"
  | "STUDENT"
  | "OPERATOR"
  | "COMMUNITY_PARTNER";

export type BatchStatus =
  | "DRAFT"
  | "READY_FOR_PICKUP"
  | "PICKUP_SCHEDULED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "UNDER_INSPECTION"
  | "ACCEPTED"
  | "CONDITIONAL"
  | "REJECTED"
  | "PROCESSED"
  | "CLOSED";

export type InspectionDecision = "ACCEPTED" | "CONDITIONAL" | "REJECTED";

export type AllocationPool = "schools" | "operator" | "contributors";

export interface ContaminationInput {
  verifiedGrossMassKg: number;
  rejectedMassKg: number;
  warningThresholdPercent: number;
  rejectThresholdPercent: number;
}

export interface ContaminationResult {
  contaminationRate: number;
  acceptedMassKg: number;
  qualityFactor: number;
  decision: InspectionDecision;
}

export interface ContributionInput {
  batchId: string;
  organisationId: string;
  pool: AllocationPool;
  acceptedMassKg: number;
  yieldFactor: number;
  qualityFactor: number;
  conditionFactor: number;
  rejected: boolean;
}

export interface ContributionResult extends ContributionInput {
  contributionScore: number;
  estimatedGasM3: number;
}

export interface AllocationConfig {
  schoolPercent: number;
  operatorPercent: number;
  contributorPercent: number;
}

export interface AllocationInput {
  verifiedGasM3: number;
  operationalUseM3: number;
  safetyReserveM3: number;
  config: AllocationConfig;
  contributions: ContributionResult[];
}

export interface AllocationResult {
  allocatableGasM3: number;
  pools: Record<AllocationPool, number>;
  allocations: Array<{
    organisationId: string;
    pool: AllocationPool;
    allocatedGasM3: number;
    scoreBasis: number;
  }>;
}
