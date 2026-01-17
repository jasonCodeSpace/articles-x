-- Remove tag column from articles table
ALTER TABLE articles DROP COLUMN IF EXISTS tag;

-- Drop related index if exists
DROP INDEX IF EXISTS idx_articles_tag;
