import type { BatchStatus } from "./types";

const transitions: Record<BatchStatus, BatchStatus[]> = {
  DRAFT: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["PICKUP_REQUESTED", "PICKUP_SCHEDULED"],
  PICKUP_REQUESTED: ["PICKUP_SCHEDULED", "READY_FOR_PICKUP"],
  PICKUP_SCHEDULED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "READY_FOR_PICKUP"],
  DELIVERED: ["UNDER_INSPECTION"],
  UNDER_INSPECTION: ["ACCEPTED", "CONDITIONAL", "REJECTED"],
  ACCEPTED: ["PROCESSED"],
  CONDITIONAL: ["PROCESSED", "REJECTED"],
  REJECTED: ["CLOSED"],
  PROCESSED: ["CLOSED"],
  CLOSED: [],
};

export function canTransitionBatch(from: BatchStatus, to: BatchStatus) {
  return transitions[from].includes(to);
}

export function assertBatchTransition(from: BatchStatus, to: BatchStatus) {
  if (!canTransitionBatch(from, to)) {
    throw new Error(`Invalid batch status transition from ${from} to ${to}.`);
  }
}

export const batchTransitions = transitions;
