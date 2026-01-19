-- Fix remaining function search_path security issues
-- Add database indexes for slow queries

-- ============================================
-- PART 1: Fix search_path for remaining functions
-- ============================================

-- Drop and recreate search_all_articles function with fixed search_path
DROP FUNCTION IF EXISTS search_all_articles(TEXT, INTEGER, INTEGER);

CREATE FUNCTION search_all_articles(
  search_term TEXT DEFAULT '',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  summary_chinese TEXT,
  author_name TEXT,
  author_handle TEXT,
  article_published_at TIMESTAMPTZ,
  image TEXT,
  table_source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT
      a.id,
      a.title,
      a.slug,
      a.summary_chinese,
      a.author_name,
      a.author_handle,
      a.article_published_at,
      a.image,
      'articles'::TEXT as table_source
    FROM articles a
    WHERE
      a.article_published_at < NOW() - INTERVAL '7 days'
      AND (
        search_term = '' OR
        a.title ILIKE '%' || search_term || '%' OR
        a.summary_chinese ILIKE '%' || search_term || '%'
      )

    UNION ALL

    SELECT
      ap1.id,
      ap1.title,
      ap1.slug,
      ap1.summary_chinese,
      ap1.author_name,
      ap1.author_handle,
      ap1.article_published_at,
      ap1.image,
      'articles_page_1'::TEXT as table_source
    FROM articles_page_1 ap1
    WHERE
      ap1.article_published_at < NOW() - INTERVAL '7 days'
      AND (
        search_term = '' OR
        ap1.title ILIKE '%' || search_term || '%' OR
        ap1.summary_chinese ILIKE '%' || search_term || '%'
      )

    UNION ALL

    SELECT
      ap2.id,
      ap2.title,
      ap2.slug,
      ap2.summary_chinese,
      ap2.author_name,
      ap2.author_handle,
      ap2.article_published_at,
      ap2.image,
      'articles_page_2'::TEXT as table_source
    FROM articles_page_2 ap2
    WHERE
      ap2.article_published_at < NOW() - INTERVAL '7 days'
      AND (
        search_term = '' OR
        ap2.title ILIKE '%' || search_term || '%' OR
        ap2.summary_chinese ILIKE '%' || search_term || '%'
      )
  )
  ORDER BY article_published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_all_articles(TEXT, INTEGER, INTEGER) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION search_all_articles(TEXT, INTEGER, INTEGER) IS 'Search across all article tables with fixed search_path - SECURITY DEFINER';

-- ============================================
-- PART 2: Add indexes for slow queries
-- ============================================

-- Enable pg_trgm extension for text search indexes (if not exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for tweet_id lookups (used by find_articles_by_short_id)
CREATE INDEX IF NOT EXISTS idx_articles_tweet_id ON articles(tweet_id);

-- Index for article_published_at DESC (used by trending page)
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc ON articles(article_published_at DESC NULLS LAST);

-- Composite index for article_published_at + id (used for pagination and sorting)
CREATE INDEX IF NOT EXISTS idx_articles_published_at_id ON articles(article_published_at DESC NULLS LAST, id DESC);

-- Index for title searches (ILIKE searches) - only if pg_trgm is available
-- Using standard btree index as fallback
CREATE INDEX IF NOT EXISTS idx_articles_title_pattern ON articles(title TEXT_PATTERN_OPS);

-- Index for author_handle lookups
CREATE INDEX IF NOT EXISTS idx_articles_author_handle ON articles(author_handle);

-- Index for tag filtering
CREATE INDEX IF NOT EXISTS idx_articles_tag ON articles USING gin (tag);

-- Partial index for articles with content (exclude NULLs for faster queries)
CREATE INDEX IF NOT EXISTS idx_articles_with_content ON articles(article_published_at DESC NULLS LAST)
WHERE full_article_content IS NOT NULL AND tweet_published_at IS NOT NULL;

-- Partial index for non-null titles (used by search)
CREATE INDEX IF NOT EXISTS idx_articles_with_title ON articles(id, title, article_published_at)
WHERE title IS NOT NULL;

-- ============================================
-- PART 3: Re-analyze tables for query planner
-- ============================================

ANALYZE articles;
ANALYZE articles_page_1;
ANALYZE articles_page_2;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON INDEX idx_articles_tweet_id IS 'Index for tweet_id lookups - speeds up article finding by tweet ID';
COMMENT ON INDEX idx_articles_published_at_desc IS 'Index for article_published_at DESC - used by trending page and article feeds';
COMMENT ON INDEX idx_articles_published_at_id IS 'Composite index for published_at + id - optimizes pagination queries';
COMMENT ON INDEX idx_articles_title_pattern IS 'Index for title pattern matching - speeds up ILIKE searches';
COMMENT ON INDEX idx_articles_author_handle IS 'Index for author_handle - speeds up author-based lookups';
COMMENT ON INDEX idx_articles_tag IS 'GIN index for tag array - speeds up tag filtering';
COMMENT ON INDEX idx_articles_with_content IS 'Partial index for articles with content - faster queries on published articles';
COMMENT ON INDEX idx_articles_with_title IS 'Partial index for non-null titles - speeds up search queries';
