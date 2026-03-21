-- CreateTable
CREATE TABLE "agency_applications" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agency_applications_agencyId_status_idx" ON "agency_applications"("agencyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agency_applications_modelId_agencyId_key" ON "agency_applications"("modelId", "agencyId");

-- AddForeignKey
ALTER TABLE "agency_applications" ADD CONSTRAINT "agency_applications_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_applications" ADD CONSTRAINT "agency_applications_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
