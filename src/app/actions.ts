"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateAllocations, calculateContribution } from "@/lib/domain/allocation";
import { calculateContamination } from "@/lib/domain/contamination";
import { assertBatchTransition } from "@/lib/domain/status";
import type { AllocationPool, Role } from "@/lib/domain/types";
import { roleDashboardPath } from "@/lib/role-routes";
import { audit } from "@/lib/services/audit";
import { requireUser } from "@/lib/services/authz";
import { rateLimit } from "@/lib/services/rate-limit";
import {
  batchFormSchema,
  conversionFormSchema,
  fulfilmentFormSchema,
  inspectionFormSchema,
  pickupFormSchema,
} from "@/lib/validation";

function token() {
  return crypto.randomUUID().replaceAll("-", "");
}

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  if (!rateLimit(`login:${email.toLowerCase()}`).ok) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { deletedAt: true, role: true },
    });
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: user && !user.deletedAt ? roleDashboardPath(user.role as Role) : "/dashboard",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    return { error: "Invalid email or password." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function createBatchAction(_: unknown, formData: FormData) {
  const user = await requireUser("create_batch");
  const parsed = batchFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid batch." };

  const code = `ORB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const batch = await prisma.wasteBatch.create({
    data: {
      batchCode: code,
      qrToken: token(),
      sourceOrganisationId: user.organisationId!,
      sourceId: parsed.data.sourceId,
      categoryId: parsed.data.categoryId,
      grossWeightKg: parsed.data.grossWeightKg,
      collectionTimestamp: new Date(parsed.data.collectionTimestamp),
      responsibleUserId: user.id,
      storageStatus: parsed.data.storageStatus,
      status: "READY_FOR_PICKUP",
      activityTimeline: [
        { status: "READY_FOR_PICKUP", at: new Date().toISOString(), actor: user.name },
      ],
      pickupRequest: {
        create: {
          thresholdReason:
            parsed.data.grossWeightKg >= 25
              ? "Volume threshold reached"
              : "Manual pickup request",
          maxStorageWarning: parsed.data.storageStatus.toLowerCase().includes("overnight"),
        },
      },
      photos: parsed.data.photoUrl ? { create: { url: parsed.data.photoUrl } } : undefined,
    },
  });
  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "BATCH_CREATED",
    entityType: "WasteBatch",
    entityId: batch.id,
    after: batch,
  });
  revalidatePath("/batches");
  redirect(`/batches/${batch.id}`);
}

export async function createBatchFormAction(formData: FormData) {
  await createBatchAction(null, formData);
}

export async function schedulePickupAction(_: unknown, formData: FormData) {
  const user = await requireUser("schedule_pickup");
  const parsed = pickupFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid pickup." };

  const before = await prisma.wasteBatch.findUniqueOrThrow({ where: { id: parsed.data.batchId } });
  assertBatchTransition(before.status, "PICKUP_SCHEDULED");

  await prisma.$transaction(async (tx) => {
    await tx.pickup.upsert({
      where: { batchId: parsed.data.batchId },
      create: {
        batchId: parsed.data.batchId,
        vehicleId: parsed.data.vehicleId || undefined,
        operatorOrgId: user.organisationId!,
        scheduledAt: new Date(parsed.data.scheduledAt),
        routeNotes: parsed.data.routeNotes,
        distanceKm: parsed.data.distanceKm,
        status: "SCHEDULED",
      },
      update: {
        vehicleId: parsed.data.vehicleId || undefined,
        scheduledAt: new Date(parsed.data.scheduledAt),
        routeNotes: parsed.data.routeNotes,
        distanceKm: parsed.data.distanceKm,
        status: "SCHEDULED",
      },
    });
    await tx.wasteBatch.update({
      where: { id: parsed.data.batchId },
      data: {
        status: "PICKUP_SCHEDULED",
        pickupStatus: "SCHEDULED",
        activityTimeline: [
          ...(Array.isArray(before.activityTimeline) ? before.activityTimeline : []),
          { status: "PICKUP_SCHEDULED", at: new Date().toISOString(), actor: user.name },
        ],
      },
    });
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "PICKUP_SCHEDULED",
    entityType: "WasteBatch",
    entityId: parsed.data.batchId,
    before,
    after: { status: "PICKUP_SCHEDULED" },
  });
  revalidatePath("/operations/pickups");
}

export async function schedulePickupFormAction(formData: FormData) {
  await schedulePickupAction(null, formData);
}

export async function confirmDeliveryAction(batchId: string) {
  const user = await requireUser("schedule_pickup");
  const before = await prisma.wasteBatch.findUniqueOrThrow({ where: { id: batchId } });
  const target = before.status === "PICKUP_SCHEDULED" ? "IN_TRANSIT" : "DELIVERED";
  assertBatchTransition(before.status, target);
  await prisma.wasteBatch.update({
    where: { id: batchId },
    data: {
      status: target,
      pickupStatus: target === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
      activityTimeline: [
        ...(Array.isArray(before.activityTimeline) ? before.activityTimeline : []),
        { status: target, at: new Date().toISOString(), actor: user.name },
      ],
    },
  });
  revalidatePath("/operations/pickups");
  revalidatePath(`/batches/${batchId}`);
}

export async function inspectBatchAction(_: unknown, formData: FormData) {
  const user = await requireUser("inspect_batch");
  const parsed = inspectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    contaminationCategories: String(formData.get("contaminationCategories") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid inspection." };

  const [before, config] = await Promise.all([
    prisma.wasteBatch.findUniqueOrThrow({ where: { id: parsed.data.batchId } }),
    prisma.allocationConfiguration.findFirstOrThrow({ where: { active: true } }),
  ]);
  assertBatchTransition(before.status, "UNDER_INSPECTION");
  const result = calculateContamination({
    verifiedGrossMassKg: parsed.data.verifiedGrossMassKg,
    rejectedMassKg: parsed.data.rejectedMassKg,
    warningThresholdPercent: config.contaminationWarning,
    rejectThresholdPercent: config.contaminationReject,
  });

  await prisma.$transaction(async (tx) => {
    await tx.wasteBatch.update({
      where: { id: parsed.data.batchId },
      data: {
        status: result.decision,
        activityTimeline: [
          ...(Array.isArray(before.activityTimeline) ? before.activityTimeline : []),
          { status: "UNDER_INSPECTION", at: new Date().toISOString(), actor: user.name },
          { status: result.decision, at: new Date().toISOString(), actor: user.name },
        ],
      },
    });
    await tx.contaminationInspection.upsert({
      where: { batchId: parsed.data.batchId },
      create: {
        batchId: parsed.data.batchId,
        inspectorId: user.id,
        verifiedGrossMassKg: parsed.data.verifiedGrossMassKg,
        rejectedMassKg: parsed.data.rejectedMassKg,
        contaminationRate: result.contaminationRate,
        acceptedMassKg: result.acceptedMassKg,
        contaminationCategories: parsed.data.contaminationCategories.split(",").map((v) => v.trim()),
        feedstockCondition: parsed.data.feedstockCondition,
        conditionFactor: parsed.data.conditionFactor,
        decision: result.decision,
        notes: parsed.data.notes,
        photoUrls: [],
      },
      update: {
        verifiedGrossMassKg: parsed.data.verifiedGrossMassKg,
        rejectedMassKg: parsed.data.rejectedMassKg,
        contaminationRate: result.contaminationRate,
        acceptedMassKg: result.acceptedMassKg,
        contaminationCategories: parsed.data.contaminationCategories.split(",").map((v) => v.trim()),
        feedstockCondition: parsed.data.feedstockCondition,
        conditionFactor: parsed.data.conditionFactor,
        decision: result.decision,
        notes: parsed.data.notes,
      },
    });
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "BATCH_INSPECTED",
    entityType: "WasteBatch",
    entityId: parsed.data.batchId,
    before,
    after: result,
  });
  revalidatePath(`/batches/${parsed.data.batchId}`);
  revalidatePath("/operations/inspections");
}

export async function inspectBatchFormAction(formData: FormData) {
  await inspectBatchAction(null, formData);
}

export async function createConversionAction(_: unknown, formData: FormData) {
  const user = await requireUser("record_conversion");
  const parsed = conversionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    batchIds: formData.getAll("batchIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid cycle." };

  const batches = await prisma.wasteBatch.findMany({
    where: { id: { in: parsed.data.batchIds } },
    include: { category: true, inspection: true },
  });
  const allocatableGasM3 =
    parsed.data.verifiedGasM3 - parsed.data.operationalUseM3 - parsed.data.safetyReserveM3;
  if (allocatableGasM3 < 0) return { error: "Operational use and reserve exceed verified gas." };

  const cycle = await prisma.$transaction(async (tx) => {
    const created = await tx.conversionCycle.create({
      data: {
        facilityId: parsed.data.facilityId,
        cycleCode: `CYC-${Date.now()}`,
        processingDate: new Date(),
        verifiedGasM3: parsed.data.verifiedGasM3,
        operationalUseM3: parsed.data.operationalUseM3,
        safetyReserveM3: parsed.data.safetyReserveM3,
        allocatableGasM3,
        digestateOutputKg: parsed.data.digestateOutputKg,
        measurementSource: parsed.data.measurementSource,
        notes: parsed.data.notes,
        measurements: {
          create: {
            volumeM3: parsed.data.verifiedGasM3,
            source: parsed.data.measurementSource,
            measuredAt: new Date(),
            notes: "Verified gas measurement. Estimated gas remains separate.",
          },
        },
        digestate: {
          create: {
            outputKg: parsed.data.digestateOutputKg,
            distributedKg: parsed.data.digestateOutputKg * 0.55,
            recipient: "Demo community gardens",
            valueEstimate: parsed.data.digestateOutputKg * 350,
          },
        },
      },
    });

    for (const batch of batches) {
      const acceptedMassKg = batch.inspection?.acceptedMassKg ?? 0;
      await tx.conversionBatch.create({
        data: { cycleId: created.id, batchId: batch.id, massKg: acceptedMassKg },
      });
      const contribution = calculateContribution({
        batchId: batch.id,
        organisationId: batch.sourceOrganisationId,
        pool:
          batch.sourceOrganisationId === user.organisationId
            ? "operator"
            : ("schools" as AllocationPool),
        acceptedMassKg,
        yieldFactor: batch.category.yieldFactor,
        qualityFactor:
          batch.inspection?.decision === "REJECTED"
            ? 0
            : Math.max(0, 1 - (batch.inspection?.contaminationRate ?? 0) / 30),
        conditionFactor: batch.inspection?.conditionFactor ?? batch.category.conditionFactor,
        rejected: batch.inspection?.decision === "REJECTED",
      });
      await tx.contributionScore.create({
        data: {
          cycleId: created.id,
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
      await tx.wasteBatch.update({
        where: { id: batch.id },
        data: { status: "PROCESSED" },
      });
    }
    return created;
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "CONVERSION_RECORDED",
    entityType: "ConversionCycle",
    entityId: cycle.id,
    after: cycle,
  });
  revalidatePath("/operations/conversions");
  redirect(`/operations/conversions/${cycle.id}`);
}

export async function createConversionFormAction(formData: FormData) {
  await createConversionAction(null, formData);
}

export async function finaliseAllocationAction(cycleId: string) {
  const user = await requireUser("calculate_allocation");
  const [cycle, config, scores, existing] = await Promise.all([
    prisma.conversionCycle.findUniqueOrThrow({ where: { id: cycleId } }),
    prisma.allocationConfiguration.findFirstOrThrow({ where: { active: true } }),
    prisma.contributionScore.findMany({ where: { cycleId } }),
    prisma.energyAllocation.findMany({ where: { cycleId, status: "FINALISED" } }),
  ]);
  if (existing.length > 0) throw new Error("Finalised allocations require a correction version.");

  const result = calculateAllocations({
    verifiedGasM3: cycle.verifiedGasM3,
    operationalUseM3: cycle.operationalUseM3,
    safetyReserveM3: cycle.safetyReserveM3,
    config: {
      schoolPercent: config.schoolPercent,
      operatorPercent: config.operatorPercent,
      contributorPercent: config.contributorPercent,
    },
    contributions: scores.map((score) => ({
      batchId: score.batchId,
      organisationId: score.organisationId,
      pool: score.pool as AllocationPool,
      acceptedMassKg: score.acceptedMassKg,
      yieldFactor: score.yieldFactor,
      qualityFactor: score.qualityFactor,
      conditionFactor: score.conditionFactor,
      rejected: score.contributionScore === 0,
      contributionScore: score.contributionScore,
      estimatedGasM3: score.estimatedGasM3,
    })),
  });

  await prisma.$transaction(
    result.allocations.map((allocation) =>
      prisma.energyAllocation.create({
        data: {
          cycleId,
          configurationId: config.id,
          recipientOrgId: allocation.organisationId,
          pool: allocation.pool,
          version: config.version,
          status: "FINALISED",
          allocatedGasM3: allocation.allocatedGasM3,
          scoreBasis: allocation.scoreBasis,
          finalisedAt: new Date(),
          notes: "Finalised from verified allocatable gas. Estimated gas was not used as measured output.",
        },
      }),
    ),
  );
  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "ALLOCATION_FINALISED",
    entityType: "ConversionCycle",
    entityId: cycleId,
    after: result,
  });
  revalidatePath("/operations/allocations");
  revalidatePath(`/operations/conversions/${cycleId}`);
}

export async function createFulfilmentAction(_: unknown, formData: FormData) {
  const user = await requireUser("fulfil_allocation");
  const parsed = fulfilmentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid fulfilment." };
  const fulfilment = await prisma.allocationFulfilment.create({
    data: {
      allocationId: parsed.data.allocationId,
      status: parsed.data.status,
      volumeM3: parsed.data.volumeM3,
      recipientName: parsed.data.recipientName,
      deliveryMode: parsed.data.deliveryMode,
      operatorName: user.name ?? "Operator",
      fulfilledAt: parsed.data.status.includes("DELIVERED") ? new Date() : undefined,
      notes: parsed.data.notes,
    },
  });
  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "ALLOCATION_FULFILMENT_RECORDED",
    entityType: "AllocationFulfilment",
    entityId: fulfilment.id,
    after: fulfilment,
  });
  revalidatePath("/operations/fulfilment");
}

export async function createFulfilmentFormAction(formData: FormData) {
  await createFulfilmentAction(null, formData);
}
