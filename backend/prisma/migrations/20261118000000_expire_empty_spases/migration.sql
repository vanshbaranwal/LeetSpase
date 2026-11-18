
ALTER TABLE "CodingSpase"
ADD COLUMN "emptySince" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "lastOccupiedAt" TIMESTAMP(3),
ADD COLUMN "closeReason" TEXT;

UPDATE "CodingSpase"
SET "emptySince" = NULL, "closeReason" = 'HOST_ENDED'
WHERE "closedAt" IS NOT NULL;

CREATE INDEX "CodingSpase_closedAt_emptySince_idx" ON "CodingSpase"("closedAt", "emptySince");
