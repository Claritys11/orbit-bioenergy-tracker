import { z } from "zod";

export const batchFormSchema = z.object({
  sourceId: z.string().uuid(),
  categoryId: z.string().uuid(),
  grossWeightKg: z.coerce.number().positive().max(5000),
  collectionTimestamp: z.string().min(1),
  storageStatus: z.string().min(3).max(80),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export const inspectionFormSchema = z.object({
  batchId: z.string().uuid(),
  verifiedGrossMassKg: z.coerce.number().positive().max(5000),
  rejectedMassKg: z.coerce.number().min(0).max(5000),
  contaminationCategories: z.string().min(1),
  feedstockCondition: z.string().min(3),
  conditionFactor: z.coerce.number().min(0).max(1.25),
  notes: z.string().min(3).max(500),
});

export const pickupFormSchema = z.object({
  batchId: z.string().uuid(),
  vehicleId: z.string().uuid().optional().or(z.literal("")),
  scheduledAt: z.string().min(1),
  routeNotes: z.string().min(3),
  distanceKm: z.coerce.number().min(0),
});

export const conversionFormSchema = z.object({
  facilityId: z.string().uuid(),
  batchIds: z.array(z.string().uuid()).min(1),
  verifiedGasM3: z.coerce.number().positive(),
  operationalUseM3: z.coerce.number().min(0),
  safetyReserveM3: z.coerce.number().min(0),
  digestateOutputKg: z.coerce.number().min(0),
  measurementSource: z.enum(["MANUAL", "SENSOR_SIMULATED", "SENSOR_VERIFIED"]),
  notes: z.string().min(3).max(500),
});

export const fulfilmentFormSchema = z.object({
  allocationId: z.string().uuid(),
  status: z.enum([
    "PENDING",
    "SCHEDULED",
    "DELIVERED_PHYSICALLY",
    "CONSUMED_AT_HUB",
    "PARTIALLY_FULFILLED",
    "CANCELLED",
    "ROLLED_OVER",
  ]),
  volumeM3: z.coerce.number().min(0),
  recipientName: z.string().min(2),
  deliveryMode: z.enum(["PIPED_BIOGAS", "LOW_PRESSURE_GAS_BAG", "ON_HUB_COMMUNITY_USAGE"]),
  notes: z.string().min(3).max(500),
});

export const containerFormSchema = z.object({
  organisationId: z.string().uuid(),
  sourceId: z.string().uuid(),
  categoryId: z.string().uuid(),
  capacityKg: z.coerce.number().positive().max(1000).default(50),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const quickBatchFromContainerSchema = z.object({
  containerId: z.string().uuid(),
  declaredMassKg: z.coerce.number().positive().max(1000),
  photoUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(200).optional().or(z.literal("")),
});
