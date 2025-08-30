-- Migration to remove duplicate articles
-- Keep the oldest article for each unique combination of title and article_url

-- First, create a temporary table with the IDs to keep (oldest by updated_at)
CREATE TEMP TABLE articles_to_keep AS
SELECT DISTINCT ON (title, article_url) id
FROM articles
ORDER BY title, article_url, updated_at ASC;

-- Delete all articles that are not in the keep list
DELETE FROM articles
WHERE id NOT IN (SELECT id FROM articles_to_keep);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE articles ADD CONSTRAINT articles_title_url_unique UNIQUE (title, article_url);

-- Create an index for better performance on deduplication checks
CREATE INDEX IF NOT EXISTS articles_title_url_idx ON articles (title, article_url);

-- Log the cleanup results
DO $$
DECLARE
    total_count INTEGER;
    unique_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM articles;
    SELECT COUNT(DISTINCT (title, article_url)) INTO unique_count FROM articles;
    
    RAISE NOTICE 'Deduplication complete. Total articles: %, Unique combinations: %', total_count, unique_count;
END $$;