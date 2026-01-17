-- Migration 035: Remove category column from articles table
-- Category is no longer needed - trending will be based on full-text search

-- Drop the category column
ALTER TABLE articles DROP COLUMN IF EXISTS category;

-- Drop the category index
DROP INDEX IF EXISTS articles_category_idx;
