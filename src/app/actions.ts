"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateAllocations, calculateContribution } from "@/lib/domain/allocation";
import { calculateContamination } from "@/lib/domain/contamination";
import { assertContainerTransition } from "@/lib/domain/container";
import { assertBatchTransition } from "@/lib/domain/status";
import type { AllocationPool, ContainerStatus, Role } from "@/lib/domain/types";
import { roleDashboardPath } from "@/lib/role-routes";
import { audit } from "@/lib/services/audit";
import { requireUser } from "@/lib/services/authz";
import { rateLimit } from "@/lib/services/rate-limit";
import {
  batchFormSchema,
  containerFormSchema,
  conversionFormSchema,
  fulfilmentFormSchema,
  inspectionFormSchema,
  pickupRequestFormSchema,
  quickBatchFromContainerSchema,
  respondPickupRequestSchema,
  schedulePickupLogisticsSchema,
} from "@/lib/validation";

function token() {
  return crypto.randomUUID().replaceAll("-", "");
}

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();
  if (!rateLimit(`login:${email.toLowerCase()}`).ok) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { deletedAt: true, role: true },
    });

    const isValidCallback =
      callbackUrl.startsWith("/") &&
      !callbackUrl.startsWith("//") &&
      !callbackUrl.startsWith("/login");

    const redirectTo = isValidCallback
      ? callbackUrl
      : user && !user.deletedAt
      ? roleDashboardPath(user.role as Role)
      : "/dashboard";

    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    return { error: "Invalid email or password." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createPartnerAction(_: unknown, formData: FormData) {
  const actor = await requireUser("manage_system");
  const orgName = String(formData.get("organisationName") ?? "").trim();
  const orgType = String(formData.get("organisationType") ?? "").trim();
  const userName = String(formData.get("userName") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as Role;

  if (!orgName || !orgType || !userName || !email || !password || !role) {
    return { error: "All fields are required." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "A user with this email address already exists." };
  }

  const slug = orgName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "");

  const org = await prisma.organisation.create({
    data: {
      name: orgName,
      slug: slug || `org-${Date.now()}`,
      type: orgType as "SCHOOL" | "COMMUNITY_PARTNER" | "OPERATOR" | "SUPPORTING_CONTRIBUTOR",
      school: orgType === "SCHOOL" ? { create: { educationLevel: "General Secondary", studentCount: 500 } } : undefined,
      facility: orgType === "OPERATOR" || orgType === "COMMUNITY_PARTNER" ? { create: { facilityType: orgType === "OPERATOR" ? "Organics Logistics Hub" : "Community Biogas Facility", capacityKgPerDay: 500, energyMode: "LOW_PRESSURE_GAS_BAG", biodigesterStatus: orgType === "COMMUNITY_PARTNER" ? "PILOT_PARTNER" : "BIODIGESTER_AVAILABLE" } } : undefined,
      contributor: orgType === "SUPPORTING_CONTRIBUTOR" ? { create: { contributorType: "Vendor Partner", contactName: userName } } : undefined,
      sources: { create: { name: `${orgName} Sorting Bay`, sourceType: orgType } },
    },
  });

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      name: userName,
      email,
      role,
      passwordHash,
      memberships: {
        create: {
          organisationId: org.id,
          role,
        },
      },
    },
  });

  await audit({
    actorId: actor.id,
    organisationId: org.id,
    action: "ORGANISATION_CREATED",
    entityType: "Organisation",
    entityId: org.id,
    after: { name: orgName, type: orgType, userEmail: email, role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/partners");
  revalidatePath("/");

  return { success: true, message: `Partner ${orgName} and user ${userName} created successfully.` };
}

export async function createBatchAction(_: unknown, formData: FormData) {
  const user = await requireUser("create_batch");
  if (!user.organisationId) return { error: "You must belong to an organisation to register waste." };

  const parsed = batchFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid batch registration data." };

  let containerId: string | undefined = undefined;
  let sourceId = parsed.data.sourceId || undefined;
  let categoryId = parsed.data.categoryId || undefined;

  if (parsed.data.containerId) {
    const container = await prisma.wasteContainer.findUnique({
      where: { id: parsed.data.containerId },
    });
    if (!container) return { error: "Selected container was not found." };
    if (user.role !== "SUPER_ADMIN" && container.organisationId !== user.organisationId) {
      return { error: "Container does not belong to your organisation." };
    }
    if (!container.isActive || container.status === "REVOKED") {
      return { error: "This container has been revoked or deactivated." };
    }
    containerId = container.id;
    if (!sourceId) sourceId = container.sourceId;
    if (!categoryId) categoryId = container.categoryId;
  }

  // Fallback to organisation's first source and category if not provided
  if (!sourceId) {
    const defaultSource = await prisma.wasteSource.findFirst({
      where: { organisationId: user.organisationId },
    });
    if (!defaultSource) return { error: "No waste source found for your organisation." };
    sourceId = defaultSource.id;
  }

  if (!categoryId) {
    const defaultCategory = await prisma.feedstockCategory.findFirst({
      orderBy: { name: "asc" },
    });
    if (!defaultCategory) return { error: "No feedstock category available." };
    categoryId = defaultCategory.id;
  }

  const code = `ORB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.wasteBatch.create({
      data: {
        batchCode: code,
        qrToken: token(),
        containerId,
        sourceOrganisationId: user.organisationId!,
        sourceId: sourceId!,
        categoryId: categoryId!,
        grossWeightKg: null, // Unverified at source! Verified only at Community Facility inspection
        declaredMassKg: parsed.data.declaredMassKg ?? null,
        collectionTimestamp: new Date(parsed.data.collectionTimestamp),
        responsibleUserId: user.id,
        storageStatus: parsed.data.storageStatus || "Container filled and ready",
        status: "READY_FOR_PICKUP",
        pickupStatus: undefined,
        activityTimeline: [
          { status: "READY_FOR_PICKUP", at: new Date().toISOString(), actor: user.name },
        ],
        photos: parsed.data.photoUrl ? { create: { url: parsed.data.photoUrl } } : undefined,
      },
    });

    if (containerId) {
      await tx.wasteContainer.update({
        where: { id: containerId },
        data: { status: "READY_FOR_PICKUP" },
      });
    }

    return created;
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
  revalidatePath("/canteen/dashboard");
  revalidatePath("/school/dashboard");
  redirect(`/batches/${batch.id}`);
}

export async function createBatchFormAction(formData: FormData) {
  await createBatchAction(null, formData);
}

export async function createPickupRequestAction(_: unknown, formData: FormData) {
  const user = await requireUser("request_pickup");
  if (!user.organisationId) return { error: "User is not linked to an organisation." };

  const rawBatchIds = formData.getAll("batchIds").map(String);
  const parsed = pickupRequestFormSchema.safeParse({
    batchIds: rawBatchIds,
    proposedPickupStart: String(formData.get("proposedPickupStart") ?? ""),
    proposedPickupEnd: String(formData.get("proposedPickupEnd") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid pickup request data." };

  const batches = await prisma.wasteBatch.findMany({
    where: {
      id: { in: parsed.data.batchIds },
      sourceOrganisationId: user.organisationId,
    },
    include: { pickupRequestItem: true },
  });

  if (batches.length !== parsed.data.batchIds.length) {
    return { error: "One or more selected batches were not found or belong to another organisation." };
  }

  for (const b of batches) {
    if (b.status !== "READY_FOR_PICKUP" || b.pickupRequestItem) {
      return { error: `Batch ${b.batchCode} is not eligible for pickup request (already requested or in transit).` };
    }
  }

  const requestCode = `REQ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.pickupRequest.create({
      data: {
        requestCode,
        schoolOrganisationId: user.organisationId!,
        requestedByUserId: user.id,
        proposedPickupStart: new Date(parsed.data.proposedPickupStart),
        proposedPickupEnd: new Date(parsed.data.proposedPickupEnd),
        notes: parsed.data.notes || undefined,
        status: "PENDING_OPERATOR_RESPONSE",
        items: {
          create: parsed.data.batchIds.map((batchId) => ({ batchId })),
        },
      },
    });

    for (const b of batches) {
      await tx.wasteBatch.update({
        where: { id: b.id },
        data: {
          status: "PICKUP_REQUESTED",
          pickupStatus: "REQUESTED",
          activityTimeline: [
            ...(Array.isArray(b.activityTimeline) ? b.activityTimeline : []),
            { status: "PICKUP_REQUESTED", at: new Date().toISOString(), actor: user.name },
          ],
        },
      });
    }

    return created;
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "PICKUP_REQUESTED",
    entityType: "PickupRequest",
    entityId: request.id,
    after: request,
  });

  revalidatePath("/operations/pickups");
  revalidatePath("/batches");
  revalidatePath("/school/dashboard");
  return { success: true, message: `Pickup request ${requestCode} submitted successfully.` };
}

export async function createPickupRequestFormAction(formData: FormData) {
  return await createPickupRequestAction(null, formData);
}

export async function respondPickupRequestAction(_: unknown, formData: FormData) {
  const user = await requireUser("respond_pickup_request");
  const parsed = respondPickupRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid response." };

  const request = await prisma.pickupRequest.findUniqueOrThrow({
    where: { id: parsed.data.requestId },
    include: { items: { include: { batch: true } } },
  });

  if (request.status !== "PENDING_OPERATOR_RESPONSE") {
    return { error: `Request ${request.requestCode} has already been responded to (${request.status}).` };
  }

  if (parsed.data.decision === "ACCEPT") {
    await prisma.$transaction(async (tx) => {
      await tx.pickupRequest.update({
        where: { id: request.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          respondedAt: new Date(),
          respondedByUserId: user.id,
          operatorOrgId: user.organisationId ?? undefined,
        },
      });
    });

    await audit({
      actorId: user.id,
      organisationId: user.organisationId,
      action: "PICKUP_REQUEST_ACCEPTED",
      entityType: "PickupRequest",
      entityId: request.id,
      after: { status: "ACCEPTED" },
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.pickupRequest.update({
        where: { id: request.id },
        data: {
          status: "REJECTED",
          rejectionReason: parsed.data.rejectionReason,
          respondedAt: new Date(),
          respondedByUserId: user.id,
          operatorOrgId: user.organisationId ?? undefined,
        },
      });

      for (const item of request.items) {
        await tx.wasteBatch.update({
          where: { id: item.batchId },
          data: {
            status: "READY_FOR_PICKUP",
            pickupStatus: "REQUESTED",
            activityTimeline: [
              ...(Array.isArray(item.batch.activityTimeline) ? item.batch.activityTimeline : []),
              { status: "REJECTED", at: new Date().toISOString(), actor: user.name, reason: parsed.data.rejectionReason },
            ],
          },
        });
      }
    });

    await audit({
      actorId: user.id,
      organisationId: user.organisationId,
      action: "PICKUP_REQUEST_REJECTED",
      entityType: "PickupRequest",
      entityId: request.id,
      reason: parsed.data.rejectionReason,
    });
  }

  revalidatePath("/operations/pickups");
  revalidatePath("/operator/dashboard");
  revalidatePath("/school/dashboard");
  return { success: true };
}

export async function respondPickupRequestFormAction(formData: FormData) {
  return await respondPickupRequestAction(null, formData);
}

export async function schedulePickupLogisticsAction(_: unknown, formData: FormData) {
  const user = await requireUser("manage_pickup_logistics");
  const parsed = schedulePickupLogisticsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid logistics schedule." };

  const request = await prisma.pickupRequest.findUniqueOrThrow({
    where: { id: parsed.data.requestId },
    include: { items: { include: { batch: true } } },
  });

  if (request.status !== "ACCEPTED" && request.status !== "SCHEDULED") {
    return { error: "Pickup request must be ACCEPTED before scheduling logistics." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pickupRequest.update({
      where: { id: request.id },
      data: {
        status: "SCHEDULED",
        actualScheduledAt: new Date(parsed.data.actualScheduledAt),
      },
    });

    await tx.pickup.upsert({
      where: { pickupRequestId: request.id },
      create: {
        pickupRequestId: request.id,
        vehicleId: parsed.data.vehicleId || undefined,
        operatorOrgId: user.organisationId!,
        scheduledAt: new Date(parsed.data.actualScheduledAt),
        routeNotes: parsed.data.routeNotes,
        distanceKm: parsed.data.distanceKm,
        status: "SCHEDULED",
      },
      update: {
        vehicleId: parsed.data.vehicleId || undefined,
        scheduledAt: new Date(parsed.data.actualScheduledAt),
        routeNotes: parsed.data.routeNotes,
        distanceKm: parsed.data.distanceKm,
        status: "SCHEDULED",
      },
    });

    for (const item of request.items) {
      await tx.wasteBatch.update({
        where: { id: item.batchId },
        data: {
          status: "PICKUP_SCHEDULED",
          pickupStatus: "SCHEDULED",
          activityTimeline: [
            ...(Array.isArray(item.batch.activityTimeline) ? item.batch.activityTimeline : []),
            { status: "PICKUP_SCHEDULED", at: new Date().toISOString(), actor: user.name },
          ],
        },
      });

      if (item.batch.containerId) {
        await tx.wasteContainer.update({
          where: { id: item.batch.containerId },
          data: { status: "SCHEDULED" },
        });
      }
    }
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "PICKUP_SCHEDULED",
    entityType: "PickupRequest",
    entityId: request.id,
    after: { status: "SCHEDULED" },
  });

  revalidatePath("/operations/pickups");
  return { success: true };
}

export async function schedulePickupLogisticsFormAction(formData: FormData) {
  return await schedulePickupLogisticsAction(null, formData);
}

export async function confirmRequestDeliveryAction(requestId: string, target: "IN_TRANSIT" | "DELIVERED") {
  const user = await requireUser("manage_pickup_logistics");
  const request = await prisma.pickupRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { pickup: true, items: { include: { batch: true } } },
  });

  await prisma.$transaction(async (tx) => {
    await tx.pickupRequest.update({
      where: { id: requestId },
      data: { status: target },
    });

    if (request.pickup) {
      await tx.pickup.update({
        where: { id: request.pickup.id },
        data: {
          status: target === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
          completedAt: target === "DELIVERED" ? new Date() : undefined,
        },
      });
    }

    for (const item of request.items) {
      await tx.wasteBatch.update({
        where: { id: item.batchId },
        data: {
          status: target,
          pickupStatus: target === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
          activityTimeline: [
            ...(Array.isArray(item.batch.activityTimeline) ? item.batch.activityTimeline : []),
            { status: target, at: new Date().toISOString(), actor: user.name },
          ],
        },
      });

      if (item.batch.containerId) {
        await tx.wasteContainer.update({
          where: { id: item.batch.containerId },
          data: { status: target === "IN_TRANSIT" ? "IN_TRANSIT" : "AT_FACILITY" },
        });
      }
    }
  });

  revalidatePath("/operations/pickups");
  revalidatePath("/batches");
}

export async function confirmDeliveryAction(batchId: string) {
  const user = await requireUser("manage_pickup_logistics");
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
  if (before.containerId) {
    await prisma.wasteContainer.update({
      where: { id: before.containerId },
      data: { status: target === "IN_TRANSIT" ? "IN_TRANSIT" : "AT_FACILITY" },
    });
  }
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
    prisma.wasteBatch.findUniqueOrThrow({
      where: { id: parsed.data.batchId },
      include: { sourceOrganisation: true },
    }),
    prisma.allocationConfiguration.findFirstOrThrow({ where: { active: true } }),
  ]);

  if (before.status !== "DELIVERED" && before.status !== "UNDER_INSPECTION") {
    return {
      error: `Batch ${before.batchCode} must be delivered to the Community Facility before inspection (current status: ${before.status}).`,
    };
  }

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
        grossWeightKg: parsed.data.verifiedGrossMassKg, // Officially measured at Community Facility
        verifiedGrossMassKg: parsed.data.verifiedGrossMassKg,
        rejectedMassKg: parsed.data.rejectedMassKg,
        acceptedMassKg: result.acceptedMassKg,
        activityTimeline: [
          ...(Array.isArray(before.activityTimeline) ? before.activityTimeline : []),
          { status: "UNDER_INSPECTION", at: new Date().toISOString(), actor: user.name },
          { status: result.decision, at: new Date().toISOString(), actor: user.name },
        ],
      },
    });
    if (before.containerId) {
      await tx.wasteContainer.update({
        where: { id: before.containerId },
        data: { status: "EMPTIED" },
      });
    }
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
  return { success: true };
}

export async function inspectBatchFormAction(formData: FormData) {
  await inspectBatchAction(null, formData);
}

export async function receiveContainerAction(tokenOrCode: string) {
  const user = await requireUser("receive_container");
  const trimmed = tokenOrCode.trim();

  const container = await prisma.wasteContainer.findFirst({
    where: {
      OR: [
        { qrToken: trimmed },
        { containerCode: trimmed },
        { id: trimmed },
      ],
    },
    include: {
      organisation: true,
      batches: {
        where: {
          status: {
            in: [
              "READY_FOR_PICKUP",
              "PICKUP_REQUESTED",
              "PICKUP_SCHEDULED",
              "IN_TRANSIT",
              "DELIVERED",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!container) {
    return { error: `Container with code/token "${trimmed}" was not found.` };
  }

  const activeBatch = container.batches[0];
  if (!activeBatch) {
    return {
      success: true,
      containerCode: container.containerCode,
      message: `Container ${container.containerCode} identified, but has no active batch in progress.`,
      batchId: null,
    };
  }

  if (activeBatch.status !== "DELIVERED") {
    await prisma.$transaction(async (tx) => {
      await tx.wasteBatch.update({
        where: { id: activeBatch.id },
        data: {
          status: "DELIVERED",
          pickupStatus: "DELIVERED",
          activityTimeline: [
            ...(Array.isArray(activeBatch.activityTimeline) ? activeBatch.activityTimeline : []),
            { status: "DELIVERED", at: new Date().toISOString(), actor: user.name, note: "Received at Community Facility" },
          ],
        },
      });
      await tx.wasteContainer.update({
        where: { id: container.id },
        data: { status: "AT_FACILITY" },
      });
    });
  }

  revalidatePath("/operations/inspections");
  revalidatePath("/scan");
  return {
    success: true,
    containerCode: container.containerCode,
    batchId: activeBatch.id,
    batchCode: activeBatch.batchCode,
    organisationName: container.organisation.name,
    status: "DELIVERED",
  };
}

export async function createConversionAction(_: unknown, formData: FormData) {
  const user = await requireUser("record_conversion");
  const parsed = conversionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    batchIds: formData.getAll("batchIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid cycle." };

  const facility = await prisma.partnerFacility.findUniqueOrThrow({
    where: { id: parsed.data.facilityId },
    include: { organisation: true },
  });

  if (user.role !== "SUPER_ADMIN" && user.organisationId !== facility.organisationId) {
    return { error: "You are not authorised to record conversion cycles for this facility." };
  }

  const batches = await prisma.wasteBatch.findMany({
    where: { id: { in: parsed.data.batchIds } },
    include: { category: true, inspection: true },
  });

  if (batches.length === 0) {
    return { error: "Please select at least one accepted batch." };
  }

  const invalidBatches = batches.filter(
    (b) => !b.inspection || (b.status !== "ACCEPTED" && b.status !== "CONDITIONAL"),
  );
  if (invalidBatches.length > 0) {
    return {
      error: `Cannot convert unaccepted batches: ${invalidBatches.map((b) => b.batchCode).join(", ")}. Only ACCEPTED or CONDITIONAL batches can enter conversion.`,
    };
  }

  const measuredGasM3 = parsed.data.measuredGasM3 ?? parsed.data.verifiedGasM3 ?? 0;
  const operationalUseM3 = parsed.data.operationalUseM3 ?? 0;
  const safetyReserveM3 = parsed.data.safetyReserveM3 ?? 0;
  const allocatableGasM3 = measuredGasM3 - operationalUseM3 - safetyReserveM3;

  if (allocatableGasM3 < 0) return { error: "Operational use and reserve exceed verified gas output." };

  const config = await prisma.allocationConfiguration.findFirstOrThrow({
    where: { active: true },
  });

  const cycle = await prisma.$transaction(async (tx) => {
    const created = await tx.conversionCycle.create({
      data: {
        facilityId: parsed.data.facilityId,
        cycleCode: `CYC-${Date.now()}`,
        processingDate: new Date(),
        verifiedGasM3: measuredGasM3, // Verified physical measured output
        operationalUseM3,
        safetyReserveM3,
        allocatableGasM3,
        digestateOutputKg: parsed.data.digestateOutputKg,
        measurementSource: parsed.data.measurementSource,
        notes: parsed.data.notes,
        measurements: {
          create: {
            volumeM3: measuredGasM3,
            source: parsed.data.measurementSource,
            measuredAt: new Date(),
            notes: "Verified physical gas measurement. Estimated gas remains separate.",
          },
        },
        digestate: {
          create: {
            outputKg: parsed.data.digestateOutputKg,
            distributedKg: parsed.data.digestateOutputKg * 0.55,
            recipient: "Community agriculture and soil restoration",
            valueEstimate: parsed.data.digestateOutputKg * 350,
          },
        },
      },
    });

    const contributions = [];
    for (const batch of batches) {
      const acceptedMassKg = batch.inspection?.acceptedMassKg ?? 0;
      await tx.conversionBatch.create({
        data: { cycleId: created.id, batchId: batch.id, massKg: acceptedMassKg },
      });
      const contribution = calculateContribution({
        batchId: batch.id,
        organisationId: batch.sourceOrganisationId,
        pool:
          batch.sourceOrganisationId === facility.organisationId
            ? "operator"
            : ("schools" as AllocationPool),
        acceptedMassKg,
        yieldFactor: batch.category.yieldFactor,
        qualityFactor:
          batch.inspection?.decision === "REJECTED"
            ? 0
            : Math.max(0, 1 - (batch.inspection?.contaminationRate ?? 0) / config.contaminationReject),
        conditionFactor: batch.inspection?.conditionFactor ?? batch.category.conditionFactor,
        rejected: batch.inspection?.decision === "REJECTED",
      });
      contributions.push(contribution);

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
      if (batch.containerId) {
        await tx.wasteContainer.update({
          where: { id: batch.containerId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    // AUTOMATIC ALLOCATION ENGINE: create finalised allocations automatically
    const allocationResult = calculateAllocations({
      verifiedGasM3: created.verifiedGasM3,
      operationalUseM3: created.operationalUseM3,
      safetyReserveM3: created.safetyReserveM3,
      config: {
        schoolPercent: config.schoolPercent,
        operatorPercent: config.operatorPercent,
        contributorPercent: config.contributorPercent,
      },
      contributions,
    });

    for (const item of allocationResult.allocations) {
      await tx.energyAllocation.create({
        data: {
          cycleId: created.id,
          configurationId: config.id,
          recipientOrgId: item.organisationId,
          pool: item.pool,
          version: 1,
          status: "FINALISED",
          allocatedGasM3: item.allocatedGasM3,
          scoreBasis: item.scoreBasis,
          finalisedAt: new Date(),
          notes: `Automatic allocation based on active config v${config.version} (50/30/20 rule).`,
        },
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

export async function createContainerAction(_: unknown, formData: FormData) {
  const user = await requireUser("manage_containers");
  const parsed = containerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid container data." };

  const org = await prisma.organisation.findUniqueOrThrow({
    where: { id: parsed.data.organisationId },
    select: { slug: true, name: true },
  });

  const slugPrefix = org.slug.replaceAll("-", "").slice(0, 6).toUpperCase();
  const count = await prisma.wasteContainer.count({
    where: { organisationId: parsed.data.organisationId },
  });
  const code = `CNT-${slugPrefix}-${String(count + 1).padStart(3, "0")}-${Math.floor(10 + Math.random() * 90)}`;
  const qr = `CNT-QR-${token().slice(0, 12).toUpperCase()}`;
  let categoryId = parsed.data.categoryId || undefined;
  if (!categoryId) {
    const mixedCategory = (await prisma.feedstockCategory.findFirst({
      where: { name: { contains: "Mixed", mode: "insensitive" } },
    })) || (await prisma.feedstockCategory.findFirst({ orderBy: { name: "asc" } }));

    if (mixedCategory) {
      categoryId = mixedCategory.id;
    } else {
      const createdCat = await prisma.feedstockCategory.create({
        data: {
          name: "Mixed Organic Waste",
          yieldFactor: 0.088,
          conditionFactor: 1.0,
          description: "Randomized and mixed canteen & school organic food scraps.",
        },
      });
      categoryId = createdCat.id;
    }
  }

  const container = await prisma.wasteContainer.create({
    data: {
      containerCode: code,
      qrToken: qr,
      organisationId: parsed.data.organisationId,
      sourceId: parsed.data.sourceId,
      categoryId,
      capacityKg: parsed.data.capacityKg,
      notes: parsed.data.notes || undefined,
      status: "AVAILABLE",
    },
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "CONTAINER_ISSUED",
    entityType: "WasteContainer",
    entityId: container.id,
    after: container,
  });

  revalidatePath("/admin/containers");
  return { success: true, containerId: container.id, qrToken: container.qrToken };
}

export async function createContainerFormAction(formData: FormData) {
  await createContainerAction(null, formData);
}

export async function updateContainerStatusAction(containerId: string, newStatus: ContainerStatus) {
  const user = await requireUser("manage_containers");
  const container = await prisma.wasteContainer.findUniqueOrThrow({ where: { id: containerId } });
  assertContainerTransition(container.status as ContainerStatus, newStatus);

  await prisma.wasteContainer.update({
    where: { id: containerId },
    data: { status: newStatus },
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "CONTAINER_STATUS_UPDATED",
    entityType: "WasteContainer",
    entityId: containerId,
    before: { status: container.status },
    after: { status: newStatus },
  });

  revalidatePath("/admin/containers");
  revalidatePath(`/c/${container.qrToken}`);
  return { success: true };
}

export async function revokeContainerAction(containerId: string, reason?: string) {
  const user = await requireUser("manage_containers");
  const container = await prisma.wasteContainer.findUniqueOrThrow({ where: { id: containerId } });

  await prisma.wasteContainer.update({
    where: { id: containerId },
    data: { status: "REVOKED", isActive: false, notes: reason ? `Revoked: ${reason}` : "Container QR revoked" },
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "CONTAINER_REVOKED",
    entityType: "WasteContainer",
    entityId: containerId,
    before: container,
    after: { status: "REVOKED", isActive: false },
    reason: reason || "Administrative revocation",
  });

  revalidatePath("/admin/containers");
  revalidatePath(`/c/${container.qrToken}`);
  return { success: true };
}

export async function createBatchFromContainerAction(_: unknown, formData: FormData) {
  const user = await requireUser("create_batch");
  const parsed = quickBatchFromContainerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid batch input." };

  const container = await prisma.wasteContainer.findUniqueOrThrow({
    where: { id: parsed.data.containerId },
    include: { organisation: true, source: true, category: true },
  });

  if (!container.isActive || container.status === "REVOKED") {
    return { error: "This container has been revoked or deactivated." };
  }

  if (user.role === "SUPER_ADMIN") {
    return { error: "Batch registration for reusable containers is reserved for canteen staff and school admins." };
  }

  const isAuthorizedRole = ["CANTEEN_STAFF", "SCHOOL_ADMIN"].includes(user.role);
  const isAuthorized =
    isAuthorizedRole &&
    (user.organisationId === container.organisationId || !user.organisationId);

  if (!isAuthorized) {
    return { error: "Waste batch registration is reserved for canteen staff and school admins of this container's school." };
  }

  const activeBatch = await prisma.wasteBatch.findFirst({
    where: {
      containerId: container.id,
      status: { notIn: ["PROCESSED", "CLOSED", "REJECTED"] },
    },
  });

  if (activeBatch) {
    return {
      error: `Container already has an active batch (${activeBatch.batchCode}) in progress. Complete pickup & inspection before submitting a new batch.`,
    };
  }

  const batchCode = `ORB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.wasteBatch.create({
      data: {
        batchCode,
        qrToken: token(),
        containerId: container.id,
        sourceOrganisationId: container.organisationId,
        sourceId: container.sourceId,
        categoryId: container.categoryId,
        grossWeightKg: null, // Unverified at source! Verified only at Community Facility inspection
        declaredMassKg: parsed.data.declaredMassKg,
        collectionTimestamp: new Date(),
        responsibleUserId: user.id,
        storageStatus: "Container Filled & Ready",
        pickupStatus: undefined,
        status: "READY_FOR_PICKUP",
        activityTimeline: [
          { status: "READY_FOR_PICKUP", at: new Date().toISOString(), actor: user.name },
        ],
        photos: parsed.data.photoUrl ? { create: { url: parsed.data.photoUrl } } : undefined,
      },
    });

    await tx.wasteContainer.update({
      where: { id: container.id },
      data: { status: "READY_FOR_PICKUP" },
    });

    return created;
  });

  await audit({
    actorId: user.id,
    organisationId: user.organisationId,
    action: "BATCH_CREATED_FROM_CONTAINER",
    entityType: "WasteBatch",
    entityId: batch.id,
    after: { batch, containerId: container.id },
  });

  revalidatePath(`/c/${container.qrToken}`);
  revalidatePath("/batches");
  revalidatePath("/canteen");
  redirect(`/c/${container.qrToken}?submitted=true`);
}

export async function createBatchFromContainerFormAction(formData: FormData) {
  await createBatchFromContainerAction(null, formData);
}
