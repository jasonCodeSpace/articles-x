-- Fix remaining function search_path security issues
-- Add database indexes for slow queries

-- ============================================
-- PART 1: Drop obsolete functions for removed tables
-- ============================================

-- Drop search_all_articles since articles_page_1 and articles_page_2 don't exist
DROP FUNCTION IF EXISTS search_all_articles(TEXT, INTEGER, INTEGER);

-- ============================================
-- PART 2: Add indexes for slow queries
-- ============================================

-- Index for tweet_id lookups
CREATE INDEX IF NOT EXISTS idx_articles_tweet_id ON articles(tweet_id);

-- Index for article_published_at DESC (used by trending page)
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc ON articles(article_published_at DESC NULLS LAST);

-- Composite index for article_published_at + id (used for pagination)
CREATE INDEX IF NOT EXISTS idx_articles_published_at_id ON articles(article_published_at DESC NULLS LAST, id DESC);

-- Index for author_handle lookups
CREATE INDEX IF NOT EXISTS idx_articles_author_handle ON articles(author_handle);

-- Partial index for articles with content
CREATE INDEX IF NOT EXISTS idx_articles_with_content ON articles(article_published_at DESC NULLS LAST)
WHERE full_article_content IS NOT NULL AND tweet_published_at IS NOT NULL;

-- Partial index for non-null titles (used by search)
CREATE INDEX IF NOT EXISTS idx_articles_with_title ON articles(id, title, article_published_at)
WHERE title IS NOT NULL;

-- ============================================
-- PART 3: Re-analyze tables for query planner
-- ============================================

ANALYZE articles;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON INDEX idx_articles_tweet_id IS 'Index for tweet_id lookups - speeds up article finding by tweet ID';
COMMENT ON INDEX idx_articles_published_at_desc IS 'Index for article_published_at DESC - used by trending page and article feeds';
COMMENT ON INDEX idx_articles_published_at_id IS 'Composite index for published_at + id - optimizes pagination queries';
COMMENT ON INDEX idx_articles_author_handle IS 'Index for author_handle - speeds up author-based lookups';
COMMENT ON INDEX idx_articles_with_content IS 'Partial index for articles with content - faster queries on published articles';
COMMENT ON INDEX idx_articles_with_title IS 'Partial index for non-null titles - speeds up search queries';
