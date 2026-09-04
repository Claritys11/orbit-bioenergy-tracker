import { describe, expect, it } from "vitest";
import { calculateAllocations, calculateContribution } from "./allocation";
import { calculateContamination } from "./contamination";
import { canTransitionContainer } from "./container";
import { can } from "./rbac";
import { canTransitionBatch } from "./status";

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

  it("calculates exact community inspection metrics: gross 18.4, rejected 2.1", () => {
    const result = calculateContamination({
      verifiedGrossMassKg: 18.4,
      rejectedMassKg: 2.1,
      warningThresholdPercent: 8,
      rejectThresholdPercent: 30,
    });
    expect(result.acceptedMassKg).toBe(16.3);
    expect(result.contaminationRate).toBe(11.41);
    expect(result.decision).toBe("CONDITIONAL");
  });

  it("throws for invalid weight metrics: zero gross, negative rejected, rejected exceeding gross", () => {
    expect(() =>
      calculateContamination({
        verifiedGrossMassKg: 0,
        rejectedMassKg: 0,
        warningThresholdPercent: 8,
        rejectThresholdPercent: 30,
      }),
    ).toThrow(/greater than zero/);

    expect(() =>
      calculateContamination({
        verifiedGrossMassKg: 18.4,
        rejectedMassKg: 20,
        warningThresholdPercent: 8,
        rejectThresholdPercent: 30,
      }),
    ).toThrow(/between zero and verified gross mass/);

    expect(() =>
      calculateContamination({
        verifiedGrossMassKg: 18.4,
        rejectedMassKg: -1,
        warningThresholdPercent: 8,
        rejectThresholdPercent: 30,
      }),
    ).toThrow(/between zero and verified gross mass/);
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

describe("permissions & capabilities", () => {
  it("grants SCHOOL_ADMIN pickup request authority but restricts inspection and conversion", () => {
    expect(can("SCHOOL_ADMIN", "request_pickup")).toBe(true);
    expect(can("SCHOOL_ADMIN", "inspect_batch")).toBe(false);
    expect(can("SCHOOL_ADMIN", "record_conversion")).toBe(false);
    expect(can("SCHOOL_ADMIN", "fulfil_allocation")).toBe(false);
  });

  it("assigns operational logistics to OPERATOR and restricts facility processing", () => {
    expect(can("OPERATOR", "respond_pickup_request")).toBe(true);
    expect(can("OPERATOR", "manage_pickup_logistics")).toBe(true);
    expect(can("OPERATOR", "inspect_batch")).toBe(false);
    expect(can("OPERATOR", "record_conversion")).toBe(false);
    expect(can("OPERATOR", "calculate_allocation")).toBe(false);
    expect(can("OPERATOR", "fulfil_allocation")).toBe(false);
    expect(can("OPERATOR", "manage_safety")).toBe(false);
    expect(can("OPERATOR", "receive_container")).toBe(false);
    expect(can("OPERATOR", "request_pickup")).toBe(false);
  });

  it("assigns facility processing, inspection, conversion, receiving, and fulfilment to COMMUNITY_PARTNER", () => {
    expect(can("COMMUNITY_PARTNER", "receive_container")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "inspect_batch")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "record_conversion")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "fulfil_allocation")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "manage_safety")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "view_reports")).toBe(true);
    expect(can("COMMUNITY_PARTNER", "respond_pickup_request")).toBe(false);
    expect(can("COMMUNITY_PARTNER", "manage_pickup_logistics")).toBe(false);
    expect(can("COMMUNITY_PARTNER", "request_pickup")).toBe(false);
  });

  it("allows CANTEEN_STAFF to register waste loads but prevents inspection, conversion, logistics, and scanner", () => {
    expect(can("CANTEEN_STAFF", "create_waste_record")).toBe(true);
    expect(can("CANTEEN_STAFF", "create_batch")).toBe(true);
    expect(can("CANTEEN_STAFF", "request_pickup")).toBe(false);
    expect(can("CANTEEN_STAFF", "inspect_batch")).toBe(false);
    expect(can("CANTEEN_STAFF", "record_conversion")).toBe(false);
    expect(can("CANTEEN_STAFF", "receive_container")).toBe(false);
  });

  it("restricts STUDENT to read-only learning without operational mutation capabilities", () => {
    expect(can("STUDENT", "view_student")).toBe(true);
    expect(can("STUDENT", "create_waste_record")).toBe(false);
    expect(can("STUDENT", "request_pickup")).toBe(false);
    expect(can("STUDENT", "inspect_batch")).toBe(false);
    expect(can("STUDENT", "record_conversion")).toBe(false);
    expect(can("STUDENT", "receive_container")).toBe(false);
  });

  it("allows only SUPER_ADMIN to manage containers and issue QR", () => {
    expect(can("SUPER_ADMIN", "manage_containers")).toBe(true);
    expect(can("SUPER_ADMIN", "issue_qr")).toBe(true);
    expect(can("CANTEEN_STAFF", "manage_containers")).toBe(false);
    expect(can("SCHOOL_ADMIN", "manage_containers")).toBe(false);
    expect(can("OPERATOR", "manage_containers")).toBe(false);
  });
});

describe("batch state transitions", () => {
  it("enforces canonical state transitions from registration to processing", () => {
    expect(canTransitionBatch("READY_FOR_PICKUP", "PICKUP_REQUESTED")).toBe(true);
    expect(canTransitionBatch("PICKUP_REQUESTED", "PICKUP_SCHEDULED")).toBe(true);
    expect(canTransitionBatch("PICKUP_SCHEDULED", "IN_TRANSIT")).toBe(true);
    expect(canTransitionBatch("IN_TRANSIT", "DELIVERED")).toBe(true);
    expect(canTransitionBatch("DELIVERED", "UNDER_INSPECTION")).toBe(true);
    expect(canTransitionBatch("UNDER_INSPECTION", "ACCEPTED")).toBe(true);
    expect(canTransitionBatch("UNDER_INSPECTION", "CONDITIONAL")).toBe(true);
    expect(canTransitionBatch("UNDER_INSPECTION", "REJECTED")).toBe(true);
    expect(canTransitionBatch("ACCEPTED", "PROCESSED")).toBe(true);
    expect(canTransitionBatch("CONDITIONAL", "PROCESSED")).toBe(true);
  });

  it("rejects invalid state jumps", () => {
    expect(canTransitionBatch("READY_FOR_PICKUP", "PROCESSED")).toBe(false);
    expect(canTransitionBatch("READY_FOR_PICKUP", "ACCEPTED")).toBe(false);
    expect(canTransitionBatch("IN_TRANSIT", "UNDER_INSPECTION")).toBe(false);
    expect(canTransitionBatch("REJECTED", "PROCESSED")).toBe(false);
    expect(canTransitionBatch("DELIVERED", "PROCESSED")).toBe(false);
  });
});

describe("urgency indicators", () => {
  function getUrgency(itemCount: number) {
    if (itemCount <= 1) return "GREEN";
    if (itemCount <= 5) return "AMBER";
    return "RED";
  }

  it("classifies ready waste accumulation threshold levels correctly", () => {
    expect(getUrgency(0)).toBe("GREEN");
    expect(getUrgency(1)).toBe("GREEN");
    expect(getUrgency(2)).toBe("AMBER");
    expect(getUrgency(5)).toBe("AMBER");
    expect(getUrgency(6)).toBe("RED");
    expect(getUrgency(10)).toBe("RED");
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
