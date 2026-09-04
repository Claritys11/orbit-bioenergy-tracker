import { prisma } from "@/lib/db";

export type Confidence = "Measured" | "Estimated" | "Simulated Demo" | "Pilot Assumption" | "Pending Field Validation";

export async function getPublicImpactData() {
  const [batches, inspections, cycles, allocations, orgs, logs] = await Promise.all([
    prisma.wasteBatch.findMany({
      include: { sourceOrganisation: true, category: true, inspection: true, conversionBatches: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contaminationInspection.findMany(),
    prisma.conversionCycle.findMany(),
    prisma.energyAllocation.findMany({ include: { fulfilments: true } }),
    prisma.organisation.findMany({
      where: { type: { in: ["SCHOOL", "OPERATOR", "SUPPORTING_CONTRIBUTOR", "COMMUNITY_PARTNER"] } },
      include: { facility: true, contributor: true },
      orderBy: { name: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { action: { in: ["BATCH_CREATED", "BATCH_INSPECTED", "CONVERSION_RECORDED", "ALLOCATION_FINALISED", "ALLOCATION_FULFILMENT_RECORDED"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const registeredWaste = batches.reduce((sum, batch) => sum + (batch.grossWeightKg ?? 0), 0);
  const acceptedWaste = inspections.reduce((sum, item) => sum + item.acceptedMassKg, 0);
  const rejectedWaste = inspections.reduce((sum, item) => sum + item.rejectedMassKg, 0);
  const contaminationRate = acceptedWaste + rejectedWaste > 0 ? (rejectedWaste / (acceptedWaste + rejectedWaste)) * 100 : 0;
  const verifiedGas = cycles.reduce((sum, cycle) => sum + cycle.verifiedGasM3, 0);
  const allocatableGas = cycles.reduce((sum, cycle) => sum + cycle.allocatableGasM3, 0);
  const allocatedGas = allocations.reduce((sum, allocation) => sum + allocation.allocatedGasM3, 0);
  const fulfilledGas = allocations.reduce(
    (sum, allocation) => sum + allocation.fulfilments.reduce((inner, item) => inner + item.volumeM3, 0),
    0,
  );

  const contributions = orgs.map((org) => {
    const orgBatches = batches.filter((batch) => batch.sourceOrganisationId === org.id);
    const orgInspections = orgBatches.flatMap((batch) => (batch.inspection ? [batch.inspection] : []));
    const accepted = orgInspections.reduce((sum, item) => sum + item.acceptedMassKg, 0);
    const rejected = orgInspections.reduce((sum, item) => sum + item.rejectedMassKg, 0);
    return {
      id: org.id,
      name: org.name,
      type: org.type,
      status: org.facility?.biodigesterStatus === "PILOT_PARTNER" ? "Pilot Partner" : org.type === "SCHOOL" ? "Participating Demo School" : "Research Candidate",
      accepted,
      contaminationRate: accepted + rejected > 0 ? (rejected / (accepted + rejected)) * 100 : 0,
    };
  });

  return {
    period: "Demo seed dataset",
    lastUpdated: new Date().toISOString(),
    confidence: "Simulated Demo" as Confidence,
    metrics: {
      registeredWaste,
      acceptedWaste,
      rejectedWaste,
      contaminationRate,
      verifiedGas,
      allocatableGas,
      allocatedGas,
      fulfilledGas,
      schools: orgs.filter((org) => org.type === "SCHOOL").length,
      partners: orgs.filter((org) => org.type === "OPERATOR").length,
    },
    contributions,
    activity: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      at: log.createdAt.toISOString(),
    })),
  };
}
