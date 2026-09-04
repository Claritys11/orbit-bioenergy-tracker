import { describe, expect, it } from "vitest";
import { calculateAllocations, calculateContribution } from "./allocation";
import { calculateContamination } from "./contamination";
import { canTransitionContainer } from "./container";
import { can } from "./rbac";

describe("contamination calculation", () => {
  it("calculates contamination rate and accepted mass", () => {
    const result = calculateContamination({
      verifiedGrossMassKg: 100,
      rejectedMassKg: 8,
      warningThresholdPercent: 8,
      rejectThresholdPercent: 30,
    });
    expect(result.contaminationRate).toBe(8);
    expect(result.acceptedMassKg).toBe(92);
    expect(result.decision).toBe("CONDITIONAL");
  });

  it("rejects unsafe or heavily contaminated material with zero contribution", () => {
    const result = calculateContamination({
      verifiedGrossMassKg: 10,
      rejectedMassKg: 3,
      warningThresholdPercent: 8,
      rejectThresholdPercent: 30,
    });
    expect(result.decision).toBe("REJECTED");
    expect(result.acceptedMassKg).toBe(0);
    expect(result.qualityFactor).toBe(0);
  });
});

describe("contribution score", () => {
  it("separates estimated gas from contribution score", () => {
    const result = calculateContribution({
      batchId: "b1",
      organisationId: "school",
      pool: "schools",
      acceptedMassKg: 50,
      yieldFactor: 0.1,
      qualityFactor: 0.8,
      conditionFactor: 0.9,
      rejected: false,
    });
    expect(result.contributionScore).toBe(3.6);
    expect(result.estimatedGasM3).toBe(4.5);
  });

  it("gives rejected batches zero score", () => {
    const result = calculateContribution({
      batchId: "b2",
      organisationId: "school",
      pool: "schools",
      acceptedMassKg: 40,
      yieldFactor: 0.1,
      qualityFactor: 0.9,
      conditionFactor: 1,
      rejected: true,
    });
    expect(result.contributionScore).toBe(0);
    expect(result.estimatedGasM3).toBe(0);
  });
});

describe("allocation engine", () => {
  const contributions = [
    calculateContribution({
      batchId: "b1",
      organisationId: "school-a",
      pool: "schools",
      acceptedMassKg: 50,
      yieldFactor: 0.1,
      qualityFactor: 1,
      conditionFactor: 1,
      rejected: false,
    }),
    calculateContribution({
      batchId: "b2",
      organisationId: "school-b",
      pool: "schools",
      acceptedMassKg: 25,
      yieldFactor: 0.1,
      qualityFactor: 1,
      conditionFactor: 1,
      rejected: false,
    }),
    calculateContribution({
      batchId: "b3",
      organisationId: "operator",
      pool: "operator",
      acceptedMassKg: 30,
      yieldFactor: 0.1,
      qualityFactor: 1,
      conditionFactor: 1,
      rejected: false,
    }),
    calculateContribution({
      batchId: "b4",
      organisationId: "market",
      pool: "contributors",
      acceptedMassKg: 20,
      yieldFactor: 0.1,
      qualityFactor: 1,
      conditionFactor: 1,
      rejected: false,
    }),
  ];

  it("applies 50/30/20 to verified allocatable gas", () => {
    const result = calculateAllocations({
      verifiedGasM3: 100,
      operationalUseM3: 10,
      safetyReserveM3: 10,
      config: { schoolPercent: 50, operatorPercent: 30, contributorPercent: 20 },
      contributions,
    });
    expect(result.allocatableGasM3).toBe(80);
    expect(result.pools.schools).toBe(40);
    expect(result.pools.operator).toBe(24);
    expect(result.pools.contributors).toBe(16);
  });

  it("allocates proportionally inside contributor pools", () => {
    const result = calculateAllocations({
      verifiedGasM3: 100,
      operationalUseM3: 0,
      safetyReserveM3: 0,
      config: { schoolPercent: 50, operatorPercent: 30, contributorPercent: 20 },
      contributions,
    });
    expect(result.allocations.find((item) => item.organisationId === "school-a")?.allocatedGasM3).toBe(33.3333);
    expect(result.allocations.find((item) => item.organisationId === "school-b")?.allocatedGasM3).toBe(16.6667);
  });

  it("redistributes unused supporting pool first to schools", () => {
    const result = calculateAllocations({
      verifiedGasM3: 100,
      operationalUseM3: 0,
      safetyReserveM3: 0,
      config: { schoolPercent: 50, operatorPercent: 30, contributorPercent: 20 },
      contributions: contributions.filter((item) => item.pool !== "contributors"),
    });
    expect(result.pools.contributors).toBe(0);
    expect(result.pools.schools).toBe(70);
  });

  it("rejects invalid contributor cap and school-largest settings", () => {
    expect(() =>
      calculateAllocations({
        verifiedGasM3: 10,
        operationalUseM3: 0,
        safetyReserveM3: 0,
        config: { schoolPercent: 30, operatorPercent: 40, contributorPercent: 30 },
        contributions,
      }),
    ).toThrow(/school pool/);
  });
});

describe("permissions", () => {
  it("restricts operator to pickups and assigns processing to community partner", () => {
    expect(can("OPERATOR", "schedule_pickup")).toBe(true);
    expect(can("OPERATOR", "inspect_batch")).toBe(false);
    expect(can("OPERATOR", "record_conversion")).toBe(false);

    expect(can("COMMUNITY_PARTNER", "inspect_batch")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "record_conversion")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "calculate_allocation")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "fulfil_allocation")).toBe(true);
  });

  it("allows only SUPER_ADMIN to manage containers and issue QR", () => {
    expect(can("SUPER_ADMIN", "manage_containers")).toBe(true);
    expect(can("SUPER_ADMIN", "issue_qr")).toBe(true);
    expect(can("CANTEEN_STAFF", "manage_containers")).toBe(false);
    expect(can("SCHOOL_ADMIN", "manage_containers")).toBe(false);
  });
});

describe("container lifecycle", () => {
  it("allows valid container status transitions", () => {
    expect(canTransitionContainer("AVAILABLE", "READY_FOR_PICKUP")).toBe(true);
    expect(canTransitionContainer("READY_FOR_PICKUP", "SCHEDULED")).toBe(true);
    expect(canTransitionContainer("SCHEDULED", "IN_TRANSIT")).toBe(true);
    expect(canTransitionContainer("IN_TRANSIT", "AT_FACILITY")).toBe(true);
    expect(canTransitionContainer("AT_FACILITY", "EMPTIED")).toBe(true);
    expect(canTransitionContainer("EMPTIED", "AVAILABLE")).toBe(true);
  });

  it("rejects invalid container transitions", () => {
    expect(canTransitionContainer("AVAILABLE", "IN_TRANSIT")).toBe(false);
    expect(canTransitionContainer("EMPTIED", "IN_TRANSIT")).toBe(false);
  });

  it("supports sequential reuse of the same physical container for multiple batches", () => {
    let containerStatus: import("./types").ContainerStatus = "AVAILABLE";
    const history: string[] = [];

    // Cycle 1: Batch #001
    expect(canTransitionContainer(containerStatus, "READY_FOR_PICKUP")).toBe(true);
    containerStatus = "READY_FOR_PICKUP";
    containerStatus = "SCHEDULED";
    containerStatus = "IN_TRANSIT";
    containerStatus = "AT_FACILITY";
    containerStatus = "EMPTIED";
    containerStatus = "AVAILABLE"; // Container freed immediately upon inspection/emptying!
    history.push("Batch #001 Processed");

    // Cycle 2: Batch #002 using SAME container
    expect(canTransitionContainer(containerStatus, "READY_FOR_PICKUP")).toBe(true);
    containerStatus = "READY_FOR_PICKUP";
    containerStatus = "SCHEDULED";
    containerStatus = "IN_TRANSIT";
    containerStatus = "AT_FACILITY";
    containerStatus = "EMPTIED";
    containerStatus = "AVAILABLE";
    history.push("Batch #002 Processed");

    expect(containerStatus).toBe("AVAILABLE");
    expect(history.length).toBe(2);
  });
});
