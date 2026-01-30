-- Add score and indexed columns to articles table
-- Run this in Supabase SQL Editor

-- Add columns
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS indexed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS score NUMERIC NOT NULL DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS articles_indexed_idx ON articles (indexed);
CREATE INDEX IF NOT EXISTS articles_score_idx ON articles (score DESC);
CREATE INDEX IF NOT EXISTS articles_indexed_score_idx ON articles (indexed, score DESC);
CREATE INDEX IF NOT EXISTS articles_indexed_published_at_idx ON articles (indexed, article_published_at DESC);

-- Add comments
COMMENT ON COLUMN articles.indexed IS 'Whether the article should be displayed on trending page';
COMMENT ON COLUMN articles.score IS 'Article quality score (0-100) based on views, likes, replies, and word count';
