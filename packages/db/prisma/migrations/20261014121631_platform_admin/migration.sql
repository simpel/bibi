-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "role" TEXT;

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "level" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "msg" TEXT,
    "service" TEXT NOT NULL,
    "surface" TEXT,
    "requestId" TEXT,
    "organizationId" TEXT,
    "userId" TEXT,
    "operation" TEXT,
    "status" INTEGER,
    "durationMs" DOUBLE PRECISION,
    "errorCode" TEXT,
    "data" JSONB NOT NULL,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSetting" (
    "feature" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "AiSetting_pkey" PRIMARY KEY ("feature")
);

-- CreateIndex
CREATE INDEX "SystemLog_time_idx" ON "SystemLog"("time");

-- CreateIndex
CREATE INDEX "SystemLog_level_time_idx" ON "SystemLog"("level", "time");

-- CreateIndex
CREATE INDEX "SystemLog_event_time_idx" ON "SystemLog"("event", "time");

-- CreateIndex
CREATE INDEX "SystemLog_requestId_idx" ON "SystemLog"("requestId");

-- CreateIndex
CREATE INDEX "SystemLog_organizationId_time_idx" ON "SystemLog"("organizationId", "time");
