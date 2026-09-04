import { hash } from "bcryptjs";
import { PrismaClient, type Role } from "@prisma/client";
import { calculateAllocations, calculateContribution } from "../src/lib/domain/allocation";
import { calculateContamination } from "../src/lib/domain/contamination";
import type { AllocationPool } from "../src/lib/domain/types";

const prisma = new PrismaClient();
const password = "OrbitDemo2026!";

async function user(name: string, email: string, role: Role, organisationId: string) {
  const created = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      role,
      passwordHash: await hash(password, 12),
      memberships: { create: { role, organisationId } },
    },
  });
  await prisma.organisationMembership.upsert({
    where: { userId_organisationId_role: { userId: created.id, organisationId, role } },
    update: {},
    create: { userId: created.id, organisationId, role },
  });
  return created;
}

async function main() {
  const existingPickups = await prisma.pickupRequest.count().catch(() => 0);
  if (existingPickups > 0) {
    console.log("Database already initialized with data. Skipping seed to preserve production data.");
    return;
  }

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.sensorDevice.deleteMany();
  await prisma.maintenanceEvent.deleteMany();
  await prisma.safetyAlert.deleteMany();
  await prisma.financialAssumption.deleteMany();
  await prisma.digestateRecord.deleteMany();
  await prisma.allocationFulfilment.deleteMany();
  await prisma.energyAllocation.deleteMany();
  await prisma.contributionScore.deleteMany();
  await prisma.gasMeasurement.deleteMany();
  await prisma.conversionBatch.deleteMany();
  await prisma.conversionCycle.deleteMany();
  await prisma.pickup.deleteMany();
  await prisma.pickupRequestItem.deleteMany();
  await prisma.pickupRequest.deleteMany();
  await prisma.contaminationInspection.deleteMany();
  await prisma.batchPhoto.deleteMany();
  await prisma.wasteBatch.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.supportingContributor.deleteMany();
  await prisma.wasteSource.deleteMany();
  await prisma.canteen.deleteMany();
  await prisma.partnerFacility.deleteMany();
  await prisma.school.deleteMany();
  await prisma.organisationMembership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.feedstockCategory.deleteMany();
  await prisma.allocationConfiguration.deleteMany();
  await prisma.organisation.deleteMany();

  const platform = await prisma.organisation.create({
    data: { name: "ORBIT Platform Demo", slug: "orbit-platform", type: "PLATFORM" },
  });

  // School A: 1 ready item (Green)
  const schoolA = await prisma.organisation.create({
    data: {
      name: "Bumi Lestari Junior School",
      slug: "bumi-lestari",
      type: "SCHOOL",
      address: "Jl. Mangga 12, Bandung",
      school: { create: { educationLevel: "Junior Secondary", studentCount: 720 } },
      canteens: { create: { name: "North Canteen", managerName: "Mira Santoso", storageLimitKg: 120 } },
      sources: { create: { name: "North Canteen Sorting Bay", sourceType: "School canteen" } },
    },
    include: { canteens: true, sources: true },
  });

  // School B: 3 ready items (Amber)
  const schoolB = await prisma.organisation.create({
    data: {
      name: "Cahaya Nusantara High School",
      slug: "cahaya-nusantara",
      type: "SCHOOL",
      address: "Jl. Kenanga 7, Bandung",
      school: { create: { educationLevel: "Senior Secondary", studentCount: 960 } },
      canteens: { create: { name: "Science Block Canteen", managerName: "Dewi Arum", storageLimitKg: 150 } },
      sources: { create: { name: "Science Block Kitchen", sourceType: "School canteen" } },
    },
    include: { canteens: true, sources: true },
  });

  // School C: 7 ready items (Red Priority)
  const schoolC = await prisma.organisation.create({
    data: {
      name: "SMK Telkom Malang",
      slug: "smk-telkom-malang",
      type: "SCHOOL",
      address: "Jl. Danau Ranau, Malang",
      school: { create: { educationLevel: "Vocational Secondary", studentCount: 1200 } },
      canteens: { create: { name: "Main Campus Canteen", managerName: "Budi Utomo", storageLimitKg: 300 } },
      sources: { create: { name: "Central Canteen Prep Station", sourceType: "School canteen" } },
    },
    include: { canteens: true, sources: true },
  });

  const operatorOrg = await prisma.organisation.create({
    data: {
      name: "KSM Energi Sirkular Bandung",
      slug: "ksm-energi-sirkular",
      type: "OPERATOR",
      address: "TPS3R Pilot Hub, Bandung",
      facility: {
        create: {
          facilityType: "TPS3R / KSM pilot facility",
          capacityKgPerDay: 850,
          biodigesterStatus: "PILOT_PARTNER",
          energyMode: "LOW_PRESSURE_GAS_BAG",
          supportedFeedstock: ["Cooked rice", "Vegetable prep", "Fruit peel", "Market produce"],
        },
      },
      sources: { create: { name: "Operator pre-processing residue", sourceType: "Operator" } },
    },
    include: { facility: true, sources: true },
  });

  const community = await prisma.organisation.create({
    data: { name: "RW 04 Community Kitchen", slug: "rw04-community", type: "COMMUNITY_PARTNER" },
  });

  const market = await prisma.organisation.create({
    data: {
      name: "Pasar Tunas Vendor Collective",
      slug: "pasar-tunas",
      type: "SUPPORTING_CONTRIBUTOR",
      contributor: { create: { contributorType: "Market produce vendor", contactName: "Raka Hidayat" } },
      sources: { create: { name: "Pasar Tunas vegetable trim", sourceType: "Market/vendor" } },
    },
    include: { sources: true },
  });

  const [_superAdmin, schoolAdmin, canteenStaff, _student, operator, partner] =
    await Promise.all([
      user("Alya Orbit", "super@orbit.test", "SUPER_ADMIN", platform.id),
      user("Nadia Pratama", "school@orbit.test", "SCHOOL_ADMIN", schoolA.id),
      user("Reno Canteen", "canteen@orbit.test", "CANTEEN_STAFF", schoolA.id),
      user("Sinta Student", "student@orbit.test", "STUDENT", schoolA.id),
      user("Bayu Operator", "operator@orbit.test", "OPERATOR", operatorOrg.id),
      user("Laras Community", "community@orbit.test", "COMMUNITY_PARTNER", community.id),
    ]);

  const categories = await Promise.all([
    prisma.feedstockCategory.create({
      data: {
        name: "Cooked rice and plate scrap",
        yieldFactor: 0.095,
        conditionFactor: 0.9,
        description: "High moisture canteen organics, demo yield assumption.",
      },
    }),
    prisma.feedstockCategory.create({
      data: {
        name: "Vegetable prep waste",
        yieldFactor: 0.082,
        conditionFactor: 1,
        description: "Cleaner prep waste with predictable digestibility.",
      },
    }),
    prisma.feedstockCategory.create({
      data: {
        name: "Fruit peel",
        yieldFactor: 0.075,
        conditionFactor: 0.95,
        description: "Fruit peel and pulp, demo yield assumption.",
      },
    }),
    prisma.feedstockCategory.create({
      data: {
        name: "Market produce trim",
        yieldFactor: 0.088,
        conditionFactor: 1.05,
        description: "Vendor vegetable trim, demo yield assumption.",
      },
    }),
  ]);

  const config = await prisma.allocationConfiguration.create({
    data: {
      version: 1,
      schoolPercent: 50,
      operatorPercent: 30,
      contributorPercent: 20,
      contaminationWarning: 8,
      contaminationReject: 30,
      orbitFeePercent: 5,
      active: true,
      reason: "Prototype demo default: 50/30/20 with school pool largest.",
    },
  });

  await prisma.vehicle.create({
    data: {
      facilityId: operatorOrg.facility!.id,
      plate: "D 2046 ORB",
      label: "Covered organics pickup cart",
      capacityKg: 350,
    },
  });

  const containerSchoolA = await prisma.wasteContainer.create({
    data: {
      containerCode: "CNT-SMK-001-01",
      qrToken: "CNT-TELKOM-001-01",
      organisationId: schoolA.id,
      sourceId: schoolA.sources[0].id,
      categoryId: categories[1].id,
      capacityKg: 100,
      status: "AVAILABLE",
      notes: "Main Canteen — Food Preparation Waste",
    },
  });

  const containerSchoolB = await prisma.wasteContainer.create({
    data: {
      containerCode: "CNT-SMK-001-02",
      qrToken: "CNT-TELKOM-001-02",
      organisationId: schoolB.id,
      sourceId: schoolB.sources[0].id,
      categoryId: categories[0].id,
      capacityKg: 120,
      status: "AVAILABLE",
      notes: "Main Canteen — Plate Scraps & Leftovers",
    },
  });

  const containerSchoolC = await prisma.wasteContainer.create({
    data: {
      containerCode: "CNT-SMK-001-03",
      qrToken: "CNT-TELKOM-001-03",
      organisationId: schoolC.id,
      sourceId: schoolC.sources[0].id,
      categoryId: categories[1].id,
      capacityKg: 150,
      status: "AVAILABLE",
      notes: "Central Canteen Prep Station Container",
    },
  });

  const containerMarket = await prisma.wasteContainer.create({
    data: {
      containerCode: "CNT-PASAR-001-01",
      qrToken: "CNT-PASAR-001-01",
      organisationId: market.id,
      sourceId: market.sources[0].id,
      categoryId: categories[3].id,
      capacityKg: 80,
      status: "AVAILABLE",
      notes: "Pasar Tunas — Vegetable & Produce Vendor Collective",
    },
  });

  // Seed Ready Batches for Accumulation Demo
  // 1. School A: 1 ready batch (GREEN)
  await prisma.wasteBatch.create({
    data: {
      batchCode: "ORB-2026-100236",
      qrToken: crypto.randomUUID().replaceAll("-", ""),
      containerId: containerSchoolA.id,
      sourceOrganisationId: schoolA.id,
      sourceId: schoolA.sources[0].id,
      categoryId: categories[1].id,
      grossWeightKg: 14.5,
      declaredMassKg: 14.5,
      collectionTimestamp: new Date(),
      responsibleUserId: canteenStaff.id,
      storageStatus: "Covered bin; ready for daily pickup",
      pickupStatus: "REQUESTED",
      status: "READY_FOR_PICKUP",
      activityTimeline: [{ status: "READY_FOR_PICKUP", at: new Date().toISOString(), actor: canteenStaff.name }],
    },
  });

  // 2. School B: 3 ready batches (AMBER)
  for (let i = 1; i <= 3; i++) {
    await prisma.wasteBatch.create({
      data: {
        batchCode: `ORB-2026-10023${6 + i}`,
        qrToken: crypto.randomUUID().replaceAll("-", ""),
        containerId: containerSchoolB.id,
        sourceOrganisationId: schoolB.id,
        sourceId: schoolB.sources[0].id,
        categoryId: categories[0].id,
        grossWeightKg: 12 + i * 4,
        declaredMassKg: 12 + i * 4,
        collectionTimestamp: new Date(),
        responsibleUserId: schoolAdmin.id,
        storageStatus: "Accumulating canteen waste",
        pickupStatus: "REQUESTED",
        status: "READY_FOR_PICKUP",
        activityTimeline: [{ status: "READY_FOR_PICKUP", at: new Date().toISOString(), actor: schoolAdmin.name }],
      },
    });
  }

  // 3. School C: 7 ready batches grouped into a PENDING PickupRequest (RED High Accumulation)
  const schoolCBatches = [];
  for (let i = 1; i <= 7; i++) {
    const b = await prisma.wasteBatch.create({
      data: {
        batchCode: `ORB-2026-10024${i}`,
        qrToken: crypto.randomUUID().replaceAll("-", ""),
        containerId: containerSchoolC.id,
        sourceOrganisationId: schoolC.id,
        sourceId: schoolC.sources[0].id,
        categoryId: categories[1].id,
        grossWeightKg: 8 + i * 3,
        declaredMassKg: 8 + i * 3,
        collectionTimestamp: new Date(),
        responsibleUserId: schoolAdmin.id,
        storageStatus: "High accumulation sorting station",
        pickupStatus: "REQUESTED",
        status: "PICKUP_REQUESTED",
        activityTimeline: [{ status: "PICKUP_REQUESTED", at: new Date().toISOString(), actor: schoolAdmin.name }],
      },
    });
    schoolCBatches.push(b);
  }

  await prisma.pickupRequest.create({
    data: {
      requestCode: "REQ-2026-000891",
      schoolOrganisationId: schoolC.id,
      requestedByUserId: schoolAdmin.id,
      requestedAt: new Date(Date.now() - 3600 * 1000),
      proposedPickupStart: new Date(Date.now() + 2 * 3600 * 1000),
      proposedPickupEnd: new Date(Date.now() + 6 * 3600 * 1000),
      status: "PENDING_OPERATOR_RESPONSE",
      notes: "7 ready containers ready behind Main Campus Canteen prep station.",
      items: {
        create: schoolCBatches.map((b) => ({ batchId: b.id })),
      },
    },
  });

  // Seed Historical Processed Batches & Conversion Cycle
  const batchInputs = [
    {
      org: schoolA,
      source: schoolA.sources[0],
      category: categories[1],
      container: containerSchoolA,
      user: canteenStaff,
      gross: 62,
      status: "ACCEPTED" as const,
      rejected: 2.5,
      conditionFactor: 0.98,
      code: "ORB-2026-100231",
    },
    {
      org: schoolB,
      source: schoolB.sources[0],
      category: categories[0],
      container: containerSchoolB,
      user: schoolAdmin,
      gross: 44,
      status: "CONDITIONAL" as const,
      rejected: 6.6,
      conditionFactor: 0.82,
      code: "ORB-2026-100232",
    },
    {
      org: market,
      source: market.sources[0],
      category: categories[3],
      container: containerMarket,
      user: partner,
      gross: 38,
      status: "ACCEPTED" as const,
      rejected: 1.1,
      conditionFactor: 1.05,
      code: "ORB-2026-100233",
    },
  ];

  const processedBatches = [];
  for (const item of batchInputs) {
    const result = calculateContamination({
      verifiedGrossMassKg: item.gross,
      rejectedMassKg: item.rejected,
      warningThresholdPercent: config.contaminationWarning,
      rejectThresholdPercent: config.contaminationReject,
    });

    const req = await prisma.pickupRequest.create({
      data: {
        requestCode: `REQ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        schoolOrganisationId: item.org.id,
        requestedByUserId: item.user.id,
        proposedPickupStart: new Date("2026-08-20T04:00:00.000Z"),
        proposedPickupEnd: new Date("2026-08-20T08:00:00.000Z"),
        status: "DELIVERED",
        acceptedAt: new Date("2026-08-20T04:30:00.000Z"),
        actualScheduledAt: new Date("2026-08-20T06:00:00.000Z"),
      },
    });

    const batch = await prisma.wasteBatch.create({
      data: {
        batchCode: item.code,
        qrToken: crypto.randomUUID().replaceAll("-", ""),
        containerId: item.container.id,
        sourceOrganisationId: item.org.id,
        sourceId: item.source.id,
        categoryId: item.category.id,
        grossWeightKg: item.gross,
        declaredMassKg: item.gross,
        collectedMassKg: item.gross,
        verifiedGrossMassKg: item.gross,
        rejectedMassKg: item.rejected,
        acceptedMassKg: result.acceptedMassKg,
        collectionTimestamp: new Date("2026-08-20T02:30:00.000Z"),
        responsibleUserId: item.user.id,
        storageStatus: "Covered bin, labelled demo data",
        pickupStatus: "DELIVERED",
        status: item.status,
        activityTimeline: [
          { status: "READY_FOR_PICKUP", at: "2026-08-20T02:45:00.000Z", actor: item.user.name },
          { status: "DELIVERED", at: "2026-08-20T07:30:00.000Z", actor: operator.name },
          { status: item.status, at: "2026-08-20T08:15:00.000Z", actor: operator.name },
        ],
        pickupRequestItem: { create: { pickupRequestId: req.id } },
        inspection: {
          create: {
            inspectorId: operator.id,
            verifiedGrossMassKg: item.gross,
            rejectedMassKg: item.rejected,
            contaminationRate: result.contaminationRate,
            acceptedMassKg: result.acceptedMassKg,
            contaminationCategories: ["minor packaging"],
            feedstockCondition: "Demo inspection: source-separated and weighed at operator hub",
            conditionFactor: item.conditionFactor,
            decision: result.decision,
            notes: `${result.decision} demo inspection.`,
            photoUrls: [],
          },
        },
      },
      include: { inspection: true, category: true },
    });
    processedBatches.push(batch);
  }

  const cycle = await prisma.conversionCycle.create({
    data: {
      facilityId: operatorOrg.facility!.id,
      cycleCode: "CYC-2026-08-DEMO",
      processingDate: new Date("2026-08-21T03:00:00.000Z"),
      verifiedGasM3: 14.8,
      operationalUseM3: 1.4,
      safetyReserveM3: 0.8,
      allocatableGasM3: 12.6,
      digestateOutputKg: 46,
      measurementSource: "MANUAL",
      notes: "Verified gas from operator meter log. Estimated gas kept separate.",
      measurements: {
        create: {
          volumeM3: 14.8,
          source: "MANUAL",
          measuredAt: new Date("2026-08-21T05:00:00.000Z"),
          notes: "Demo verified output, not an AI prediction.",
        },
      },
    },
  });

  const contributions = [];
  for (const batch of processedBatches) {
    const pool: AllocationPool =
      batch.sourceOrganisationId === market.id ? "contributors" : "schools";
    const contribution = calculateContribution({
      batchId: batch.id,
      organisationId: batch.sourceOrganisationId,
      pool,
      acceptedMassKg: batch.inspection?.acceptedMassKg ?? 0,
      yieldFactor: batch.category.yieldFactor,
      qualityFactor:
        batch.inspection?.decision === "REJECTED"
          ? 0
          : Math.max(0, 1 - (batch.inspection?.contaminationRate ?? 0) / config.contaminationReject),
      conditionFactor: batch.inspection?.conditionFactor ?? batch.category.conditionFactor,
      rejected: batch.inspection?.decision === "REJECTED",
    });
    contributions.push(contribution);
    await prisma.conversionBatch.create({
      data: { cycleId: cycle.id, batchId: batch.id, massKg: contribution.acceptedMassKg },
    });
    await prisma.contributionScore.create({
      data: {
        cycleId: cycle.id,
        batchId: contribution.batchId,
        organisationId: contribution.organisationId,
        pool: contribution.pool,
        acceptedMassKg: contribution.acceptedMassKg,
        yieldFactor: contribution.yieldFactor,
        qualityFactor: contribution.qualityFactor,
        conditionFactor: contribution.conditionFactor,
        contributionScore: contribution.contributionScore,
        estimatedGasM3: contribution.estimatedGasM3,
      },
    });
    await prisma.wasteBatch.update({ where: { id: batch.id }, data: { status: "PROCESSED" } });
  }

  const allocation = calculateAllocations({
    verifiedGasM3: cycle.verifiedGasM3,
    operationalUseM3: cycle.operationalUseM3,
    safetyReserveM3: cycle.safetyReserveM3,
    config: {
      schoolPercent: config.schoolPercent,
      operatorPercent: config.operatorPercent,
      contributorPercent: config.contributorPercent,
    },
    contributions,
  });

  for (const item of allocation.allocations) {
    const created = await prisma.energyAllocation.create({
      data: {
        cycleId: cycle.id,
        configurationId: config.id,
        recipientOrgId: item.organisationId,
        pool: item.pool,
        version: 1,
        status: "FINALISED",
        allocatedGasM3: item.allocatedGasM3,
        scoreBasis: item.scoreBasis,
        finalisedAt: new Date("2026-08-21T07:00:00.000Z"),
        notes: "Demo finalised allocation from verified allocatable gas.",
      },
    });
    await prisma.allocationFulfilment.create({
      data: {
        allocationId: created.id,
        status: item.pool === "schools" ? "PARTIALLY_FULFILLED" : "PENDING",
        volumeM3: item.pool === "schools" ? item.allocatedGasM3 * 0.45 : 0,
        recipientName:
          item.pool === "schools" ? "School community cooking demo" : "Pending scheduled use",
        deliveryMode: item.pool === "schools" ? "LOW_PRESSURE_GAS_BAG" : "ON_HUB_COMMUNITY_USAGE",
        fulfilledAt: item.pool === "schools" ? new Date("2026-08-22T04:30:00.000Z") : undefined,
        operatorName: operator.name,
        notes: "Fulfilment evidence recorded for demo allocation.",
      },
    });
  }

  console.log(`Seeded ORBIT demo. Login password for every demo account: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
