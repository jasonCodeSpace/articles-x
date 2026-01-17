-- Migration: Pipeline Redesign
-- Remove unused fields and ensure required fields exist

-- Remove unused fields
ALTER TABLE articles DROP COLUMN IF EXISTS tweet_bookmarks;
ALTER TABLE articles DROP COLUMN IF EXISTS article_preview_text;

-- Ensure required fields exist
ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_english TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add index for deduplication queries
CREATE INDEX IF NOT EXISTS idx_articles_tweet_id ON articles(tweet_id);
