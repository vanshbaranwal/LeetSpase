BEGIN;
-- DropForeignKey
ALTER TABLE "CodingSpase" DROP CONSTRAINT "CodingSpase_hostId_fkey";

-- AlterTable
ALTER TABLE "CodingSpase" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "creatorKnown" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "endedById" TEXT,
ADD COLUMN     "historyStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "hostId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CodingSpaseJob" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "problemTitle" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CodingSpaseParticipant" (
    "id" TEXT NOT NULL,
    "spaseId" TEXT NOT NULL,
    "participantKey" TEXT NOT NULL,
    "userId" TEXT,
    "legacy" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CodingSpaseParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingSpaseVisit" (
    "id" TEXT NOT NULL,
    "spaseId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "initialRole" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "leaveReason" TEXT,

    CONSTRAINT "CodingSpaseVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingSpaseActivity" (
    "id" TEXT NOT NULL,
    "spaseId" TEXT NOT NULL,
    "actorId" TEXT,
    "problemId" TEXT,
    "problemTitle" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingSpaseActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodingSpaseParticipant_userId_idx" ON "CodingSpaseParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CodingSpaseParticipant_spaseId_participantKey_key" ON "CodingSpaseParticipant"("spaseId", "participantKey");

-- CreateIndex
CREATE INDEX "CodingSpaseVisit_spaseId_joinedAt_id_idx" ON "CodingSpaseVisit"("spaseId", "joinedAt", "id");

-- CreateIndex
CREATE INDEX "CodingSpaseVisit_participantId_sessionId_leftAt_idx" ON "CodingSpaseVisit"("participantId", "sessionId", "leftAt");

-- CreateIndex
CREATE INDEX "CodingSpaseVisit_leftAt_lastSeenAt_idx" ON "CodingSpaseVisit"("leftAt", "lastSeenAt");

-- CreateIndex
CREATE INDEX "CodingSpaseActivity_spaseId_createdAt_id_idx" ON "CodingSpaseActivity"("spaseId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CodingSpaseActivity_actorId_idx" ON "CodingSpaseActivity"("actorId");

-- CreateIndex
CREATE INDEX "CodingSpaseActivity_problemId_idx" ON "CodingSpaseActivity"("problemId");

-- CreateIndex
CREATE INDEX "CodingSpase_createdAt_id_idx" ON "CodingSpase"("createdAt", "id");

-- CreateIndex
CREATE INDEX "CodingSpase_hostId_createdAt_idx" ON "CodingSpase"("hostId", "createdAt");

-- CreateIndex
CREATE INDEX "CodingSpase_creatorId_idx" ON "CodingSpase"("creatorId");

-- AddForeignKey
ALTER TABLE "CodingSpase" ADD CONSTRAINT "CodingSpase_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpase" ADD CONSTRAINT "CodingSpase_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpase" ADD CONSTRAINT "CodingSpase_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve known participants without inventing historical visit timestamps.
INSERT INTO "CodingSpaseParticipant" ("id", "spaseId", "participantKey", "userId", "legacy")
SELECT md5("spaseId" || ':' || "userId"), "spaseId", "userId", "userId", true FROM "CodingSpaseMember";

-- Earlier host transfers did not retain the original creator.
UPDATE "CodingSpase" SET "creatorKnown" = false;
UPDATE "CodingSpase" SET "endedById" = "hostId" WHERE "closeReason" = 'HOST_ENDED';

UPDATE "CodingSpaseJob" j SET "problemTitle" = p."title" FROM "Problem" p WHERE j."problemId" = p."id";
UPDATE "CodingSpaseJob" j SET "userId" = NULL
WHERE j."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = j."userId");

-- AddForeignKey
ALTER TABLE "CodingSpaseJob" ADD CONSTRAINT "CodingSpaseJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpaseParticipant" ADD CONSTRAINT "CodingSpaseParticipant_spaseId_fkey" FOREIGN KEY ("spaseId") REFERENCES "CodingSpase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpaseParticipant" ADD CONSTRAINT "CodingSpaseParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpaseVisit" ADD CONSTRAINT "CodingSpaseVisit_spaseId_fkey" FOREIGN KEY ("spaseId") REFERENCES "CodingSpase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpaseVisit" ADD CONSTRAINT "CodingSpaseVisit_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "CodingSpaseParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpaseActivity" ADD CONSTRAINT "CodingSpaseActivity_spaseId_fkey" FOREIGN KEY ("spaseId") REFERENCES "CodingSpase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpaseActivity" ADD CONSTRAINT "CodingSpaseActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSpaseActivity" ADD CONSTRAINT "CodingSpaseActivity_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;


COMMIT;
