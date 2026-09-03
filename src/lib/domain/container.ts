import type { ContainerStatus } from "./types";

const containerTransitions: Record<ContainerStatus, ContainerStatus[]> = {
  AVAILABLE: ["READY_FOR_PICKUP", "REVOKED", "INACTIVE"],
  READY_FOR_PICKUP: ["SCHEDULED", "AVAILABLE", "REVOKED", "INACTIVE"],
  SCHEDULED: ["IN_TRANSIT", "READY_FOR_PICKUP", "REVOKED"],
  IN_TRANSIT: ["AT_FACILITY", "SCHEDULED", "REVOKED"],
  AT_FACILITY: ["EMPTIED", "AVAILABLE", "REVOKED"],
  EMPTIED: ["AVAILABLE", "READY_FOR_PICKUP", "REVOKED"],
  REVOKED: ["AVAILABLE", "INACTIVE"],
  INACTIVE: ["AVAILABLE", "REVOKED"],
};

export function canTransitionContainer(from: ContainerStatus, to: ContainerStatus): boolean {
  return containerTransitions[from]?.includes(to) ?? false;
}

export function assertContainerTransition(from: ContainerStatus, to: ContainerStatus): void {
  if (!canTransitionContainer(from, to)) {
    throw new Error(`Invalid container status transition from ${from} to ${to}.`);
  }
}

export const containerStatusTransitions = containerTransitions;
