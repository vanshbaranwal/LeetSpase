-- Add structured editorial content while keeping the existing editorial field
-- as the problem's approach for backward compatibility.
ALTER TABLE "Problem"
ADD COLUMN "intuition" TEXT,
ADD COLUMN "walkthrough" TEXT,
ADD COLUMN "timeComplexity" TEXT,
ADD COLUMN "spaceComplexity" TEXT;
