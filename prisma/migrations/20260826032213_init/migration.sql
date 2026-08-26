-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'CANTEEN_STAFF', 'STUDENT', 'OPERATOR', 'COMMUNITY_PARTNER');

-- CreateEnum
CREATE TYPE "OrganisationType" AS ENUM ('SCHOOL', 'OPERATOR', 'COMMUNITY_PARTNER', 'SUPPORTING_CONTRIBUTOR', 'PLATFORM');

-- CreateEnum
CREATE TYPE "BiodigesterStatus" AS ENUM ('UNVERIFIED', 'NO_BIODIGESTER', 'BIODIGESTER_AVAILABLE', 'PILOT_PARTNER', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'READY_FOR_PICKUP', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'UNDER_INSPECTION', 'ACCEPTED', 'CONDITIONAL', 'REJECTED', 'PROCESSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InspectionDecision" AS ENUM ('ACCEPTED', 'CONDITIONAL', 'REJECTED');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('SIMULATED', 'FINALISED', 'CORRECTED');

-- CreateEnum
CREATE TYPE "FulfilmentStatus" AS ENUM ('PENDING', 'SCHEDULED', 'DELIVERED_PHYSICALLY', 'CONSUMED_AT_HUB', 'PARTIALLY_FULFILLED', 'CANCELLED', 'ROLLED_OVER');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('PIPED_BIOGAS', 'LOW_PRESSURE_GAS_BAG', 'ON_HUB_COMMUNITY_USAGE');

-- CreateEnum
CREATE TYPE "MeasurementSource" AS ENUM ('MANUAL', 'SENSOR_SIMULATED', 'SENSOR_VERIFIED');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "image" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganisationType" NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganisationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Canteen" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "storageLimitKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Canteen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerFacility" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "capacityKgPerDay" DOUBLE PRECISION NOT NULL,
    "biodigesterStatus" "BiodigesterStatus" NOT NULL,
    "energyMode" "DeliveryMode" NOT NULL,
    "supportedFeedstock" TEXT[],

    CONSTRAINT "PartnerFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteSource" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,

    CONSTRAINT "WasteSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedstockCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yieldFactor" DOUBLE PRECISION NOT NULL,
    "conditionFactor" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "FeedstockCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteBatch" (
    "id" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "sourceOrganisationId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "grossWeightKg" DOUBLE PRECISION NOT NULL,
    "collectionTimestamp" TIMESTAMP(3) NOT NULL,
    "responsibleUserId" TEXT NOT NULL,
    "storageStatus" TEXT NOT NULL,
    "pickupStatus" "PickupStatus" NOT NULL DEFAULT 'REQUESTED',
    "status" "BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "activityTimeline" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchPhoto" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaminationInspection" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "verifiedGrossMassKg" DOUBLE PRECISION NOT NULL,
    "rejectedMassKg" DOUBLE PRECISION NOT NULL,
    "contaminationRate" DOUBLE PRECISION NOT NULL,
    "acceptedMassKg" DOUBLE PRECISION NOT NULL,
    "contaminationCategories" TEXT[],
    "feedstockCondition" TEXT NOT NULL,
    "conditionFactor" DOUBLE PRECISION NOT NULL,
    "decision" "InspectionDecision" NOT NULL,
    "notes" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContaminationInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thresholdReason" TEXT NOT NULL,
    "maxStorageWarning" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "capacityKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pickup" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "operatorOrgId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "routeNotes" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "status" "PickupStatus" NOT NULL,
    "failedReason" TEXT,

    CONSTRAINT "Pickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionCycle" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "cycleCode" TEXT NOT NULL,
    "processingDate" TIMESTAMP(3) NOT NULL,
    "verifiedGasM3" DOUBLE PRECISION NOT NULL,
    "operationalUseM3" DOUBLE PRECISION NOT NULL,
    "safetyReserveM3" DOUBLE PRECISION NOT NULL,
    "allocatableGasM3" DOUBLE PRECISION NOT NULL,
    "digestateOutputKg" DOUBLE PRECISION NOT NULL,
    "measurementSource" "MeasurementSource" NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionBatch" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "massKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ConversionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GasMeasurement" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "volumeM3" DOUBLE PRECISION NOT NULL,
    "source" "MeasurementSource" NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "GasMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationConfiguration" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schoolPercent" DOUBLE PRECISION NOT NULL,
    "operatorPercent" DOUBLE PRECISION NOT NULL,
    "contributorPercent" DOUBLE PRECISION NOT NULL,
    "contaminationWarning" DOUBLE PRECISION NOT NULL,
    "contaminationReject" DOUBLE PRECISION NOT NULL,
    "orbitFeePercent" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,

    CONSTRAINT "AllocationConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionScore" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "acceptedMassKg" DOUBLE PRECISION NOT NULL,
    "yieldFactor" DOUBLE PRECISION NOT NULL,
    "qualityFactor" DOUBLE PRECISION NOT NULL,
    "conditionFactor" DOUBLE PRECISION NOT NULL,
    "contributionScore" DOUBLE PRECISION NOT NULL,
    "estimatedGasM3" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ContributionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyAllocation" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "recipientOrgId" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "AllocationStatus" NOT NULL,
    "allocatedGasM3" DOUBLE PRECISION NOT NULL,
    "scoreBasis" DOUBLE PRECISION NOT NULL,
    "finalisedAt" TIMESTAMP(3),
    "supersedesId" TEXT,
    "notes" TEXT NOT NULL,

    CONSTRAINT "EnergyAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationFulfilment" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "status" "FulfilmentStatus" NOT NULL,
    "volumeM3" DOUBLE PRECISION NOT NULL,
    "recipientName" TEXT NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "deliveryMode" "DeliveryMode" NOT NULL,
    "proofUrl" TEXT,
    "operatorName" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "AllocationFulfilment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportingContributor" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "contributorType" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,

    CONSTRAINT "SupportingContributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestateRecord" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "outputKg" DOUBLE PRECISION NOT NULL,
    "distributedKg" DOUBLE PRECISION NOT NULL,
    "recipient" TEXT NOT NULL,
    "valueEstimate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestateRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAssumption" (
    "id" TEXT NOT NULL,
    "energyPricePerM3" DOUBLE PRECISION NOT NULL,
    "wasteSavingsPerKg" DOUBLE PRECISION NOT NULL,
    "digestateValuePerKg" DOUBLE PRECISION NOT NULL,
    "collectionCostPerKg" DOUBLE PRECISION NOT NULL,
    "processingCostPerKg" DOUBLE PRECISION NOT NULL,
    "maintenanceCostPerCycle" DOUBLE PRECISION NOT NULL,
    "platformFeePercent" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAssumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAlert" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "SafetySeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceEvent" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" "SafetySeverity" NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL,

    CONSTRAINT "MaintenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorDevice" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SensorDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "organisationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

-- CreateIndex
CREATE INDEX "OrganisationMembership_organisationId_role_idx" ON "OrganisationMembership"("organisationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationMembership_userId_organisationId_role_key" ON "OrganisationMembership"("userId", "organisationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "School_organisationId_key" ON "School"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerFacility_organisationId_key" ON "PartnerFacility"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedstockCategory_name_key" ON "FeedstockCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WasteBatch_batchCode_key" ON "WasteBatch"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "WasteBatch_qrToken_key" ON "WasteBatch"("qrToken");

-- CreateIndex
CREATE INDEX "WasteBatch_sourceOrganisationId_status_idx" ON "WasteBatch"("sourceOrganisationId", "status");

-- CreateIndex
CREATE INDEX "WasteBatch_qrToken_idx" ON "WasteBatch"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "ContaminationInspection_batchId_key" ON "ContaminationInspection"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "PickupRequest_batchId_key" ON "PickupRequest"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Pickup_batchId_key" ON "Pickup"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionCycle_cycleCode_key" ON "ConversionCycle"("cycleCode");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionBatch_cycleId_batchId_key" ON "ConversionBatch"("cycleId", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "AllocationConfiguration_version_key" ON "AllocationConfiguration"("version");

-- CreateIndex
CREATE INDEX "ContributionScore_cycleId_pool_idx" ON "ContributionScore"("cycleId", "pool");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionScore_cycleId_batchId_key" ON "ContributionScore"("cycleId", "batchId");

-- CreateIndex
CREATE INDEX "EnergyAllocation_cycleId_status_idx" ON "EnergyAllocation"("cycleId", "status");

-- CreateIndex
CREATE INDEX "EnergyAllocation_recipientOrgId_idx" ON "EnergyAllocation"("recipientOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportingContributor_organisationId_key" ON "SupportingContributor"("organisationId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMembership" ADD CONSTRAINT "OrganisationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMembership" ADD CONSTRAINT "OrganisationMembership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Canteen" ADD CONSTRAINT "Canteen_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerFacility" ADD CONSTRAINT "PartnerFacility_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteSource" ADD CONSTRAINT "WasteSource_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteBatch" ADD CONSTRAINT "WasteBatch_sourceOrganisationId_fkey" FOREIGN KEY ("sourceOrganisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteBatch" ADD CONSTRAINT "WasteBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "WasteSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteBatch" ADD CONSTRAINT "WasteBatch_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FeedstockCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteBatch" ADD CONSTRAINT "WasteBatch_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchPhoto" ADD CONSTRAINT "BatchPhoto_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WasteBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaminationInspection" ADD CONSTRAINT "ContaminationInspection_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WasteBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaminationInspection" ADD CONSTRAINT "ContaminationInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WasteBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "PartnerFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WasteBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionCycle" ADD CONSTRAINT "ConversionCycle_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "PartnerFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionBatch" ADD CONSTRAINT "ConversionBatch_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ConversionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionBatch" ADD CONSTRAINT "ConversionBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WasteBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasMeasurement" ADD CONSTRAINT "GasMeasurement_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ConversionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionScore" ADD CONSTRAINT "ContributionScore_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ConversionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionScore" ADD CONSTRAINT "ContributionScore_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WasteBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyAllocation" ADD CONSTRAINT "EnergyAllocation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ConversionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyAllocation" ADD CONSTRAINT "EnergyAllocation_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "AllocationConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationFulfilment" ADD CONSTRAINT "AllocationFulfilment_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "EnergyAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingContributor" ADD CONSTRAINT "SupportingContributor_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestateRecord" ADD CONSTRAINT "DigestateRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ConversionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "SensorDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
