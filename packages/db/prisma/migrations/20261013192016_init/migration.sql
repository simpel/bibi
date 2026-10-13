-- pgvector (Prisma postgresqlExtensions is preview-only, so enabled here)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "conversationId" TEXT,
    "operation" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(1536),
    "search" tsvector GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "streetAddress" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SE',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "openingHours" TEXT,
    "defaultVatRatePercent" INTEGER NOT NULL DEFAULT 25,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "floor" TEXT,
    "areaSqm" DOUBLE PRECISION,
    "ceilingHeightM" DOUBLE PRECISION,
    "hasDaylight" BOOLEAN NOT NULL DEFAULT false,
    "maxCapacity" INTEGER,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_entityType_entityId_idx" ON "AuditLog"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Embedding_organizationId_entityType_idx" ON "Embedding"("organizationId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_organizationId_entityType_entityId_key" ON "Embedding"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Venue_organizationId_status_idx" ON "Venue"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_id_organizationId_key" ON "Venue"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Room_organizationId_status_idx" ON "Room"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Room_organizationId_venueId_idx" ON "Room"("organizationId", "venueId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_venueId_organizationId_fkey" FOREIGN KEY ("venueId", "organizationId") REFERENCES "Venue"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Search indexes (not expressible in Prisma schema)
CREATE INDEX "Embedding_embedding_hnsw_idx" ON "Embedding" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "Embedding_search_gin_idx" ON "Embedding" USING gin ("search");
