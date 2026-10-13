-- AlterTable
ALTER TABLE "Problem" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- Mark the requested existing problems as demos by their stable title keys.
UPDATE "Problem"
SET "isDemo" = true
WHERE "titleKey" IN (
    'add two numbers',
    'array minimum and maximum',
    'best contiguous segment sum',
    'burst balloons for maximum score'
);
