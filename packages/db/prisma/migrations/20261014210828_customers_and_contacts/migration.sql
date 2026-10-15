-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "invoiceStreetAddress" TEXT,
    "invoicePostalCode" TEXT,
    "invoiceCity" TEXT,
    "invoiceCountry" TEXT NOT NULL DEFAULT 'SE',
    "paymentTermsDays" INTEGER,
    "creditLimitMinor" INTEGER,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_organizationId_status_idx" ON "Customer"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Customer_organizationId_entityTypeId_idx" ON "Customer"("organizationId", "entityTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_organizationId_key" ON "Customer"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_status_idx" ON "Contact"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Contact_organizationId_customerId_idx" ON "Contact"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_entityTypeId_idx" ON "Contact"("organizationId", "entityTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_id_organizationId_key" ON "Contact"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
