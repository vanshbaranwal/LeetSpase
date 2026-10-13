-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing accounts receive a stable username based on their email and id.
UPDATE "User"
SET "username" = CONCAT(
  COALESCE(NULLIF(REGEXP_REPLACE(LOWER(SPLIT_PART("email", '@', 1)), '[^a-z0-9_]', '', 'g'), ''), 'coder'),
  '_',
  SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 6)
);

-- Accounts already connected to Google have a verified email.
UPDATE "User"
SET "isVerified" = true
WHERE "googleId" IS NOT NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
