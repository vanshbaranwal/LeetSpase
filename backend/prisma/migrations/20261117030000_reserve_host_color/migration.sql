
BEGIN;

-- An existing member in slot zero moves to a free member color for their spase.
UPDATE "CodingSpaseMember" AS member
SET "colorIndex" = (
    SELECT color
    FROM generate_series(1, 4) AS palette(color)
    WHERE NOT EXISTS (
        SELECT 1
        FROM "CodingSpaseMember" AS other
        WHERE other."spaseId" = member."spaseId"
          AND other."userId" <> spase."hostId"
          AND other."removedAt" IS NULL
          AND other."reservedUntil" > CURRENT_TIMESTAMP
          AND other."colorIndex" = palette.color
    )
    ORDER BY random()
    LIMIT 1
)
FROM "CodingSpase" AS spase
WHERE member."spaseId" = spase."id"
  AND member."userId" <> spase."hostId"
  AND member."colorIndex" = 0;

UPDATE "CodingSpaseMember" AS host
SET "colorIndex" = 0
FROM "CodingSpase" AS spase
WHERE host."spaseId" = spase."id"
  AND host."userId" = spase."hostId"
  AND host."colorIndex" IS DISTINCT FROM 0;

COMMIT;
