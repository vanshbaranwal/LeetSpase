ALTER TABLE "Problem" ADD COLUMN "titleKey" TEXT;

UPDATE "Problem"
SET "titleKey" = lower(
    regexp_replace(btrim("title"), '[[:space:]]+', ' ', 'g')
);

ALTER TABLE "Problem" ALTER COLUMN "titleKey" SET NOT NULL;

CREATE UNIQUE INDEX "Problem_titleKey_key" ON "Problem"("titleKey");
