-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('AVAILABLE', 'READY_FOR_PICKUP', 'SCHEDULED', 'IN_TRANSIT', 'AT_FACILITY', 'EMPTIED', 'REVOKED', 'INACTIVE');

-- AlterTable
ALTER TABLE "WasteBatch" ADD COLUMN     "acceptedMassKg" DOUBLE PRECISION,
ADD COLUMN     "collectedMassKg" DOUBLE PRECISION,
ADD COLUMN     "containerId" TEXT,
ADD COLUMN     "declaredMassKg" DOUBLE PRECISION,
ADD COLUMN     "rejectedMassKg" DOUBLE PRECISION,
ADD COLUMN     "verifiedGrossMassKg" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "WasteContainer" (
    "id" TEXT NOT NULL,
    "containerCode" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "capacityKg" DOUBLE PRECISION DEFAULT 50.0,
    "status" "ContainerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteContainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WasteContainer_containerCode_key" ON "WasteContainer"("containerCode");

-- CreateIndex
CREATE UNIQUE INDEX "WasteContainer_qrToken_key" ON "WasteContainer"("qrToken");

-- CreateIndex
CREATE INDEX "WasteContainer_organisationId_status_idx" ON "WasteContainer"("organisationId", "status");

-- CreateIndex
CREATE INDEX "WasteContainer_qrToken_idx" ON "WasteContainer"("qrToken");

-- CreateIndex
CREATE INDEX "WasteBatch_containerId_idx" ON "WasteBatch"("containerId");

-- AddForeignKey
ALTER TABLE "WasteContainer" ADD CONSTRAINT "WasteContainer_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteContainer" ADD CONSTRAINT "WasteContainer_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "WasteSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteContainer" ADD CONSTRAINT "WasteContainer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FeedstockCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteBatch" ADD CONSTRAINT "WasteBatch_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "WasteContainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
