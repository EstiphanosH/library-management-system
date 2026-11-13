-- Add and populate stable slugs for existing genres before making the column required.
ALTER TABLE "genres" ADD COLUMN "slug" TEXT;

WITH normalized AS (
    SELECT
        "id",
        COALESCE(
            NULLIF(
                TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g')),
                ''
            ),
            'genre'
        ) AS base_slug
    FROM "genres"
),
ranked AS (
    SELECT
        "id",
        base_slug,
        ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY "id") AS duplicate_number
    FROM normalized
)
UPDATE "genres" AS genre
SET "slug" = CASE
    WHEN ranked.duplicate_number = 1 THEN ranked.base_slug
    ELSE ranked.base_slug || '-' || SUBSTRING(ranked."id"::TEXT, 1, 8)
END
FROM ranked
WHERE genre."id" = ranked."id";

ALTER TABLE "genres" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");
