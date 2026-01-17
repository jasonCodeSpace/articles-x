-- Add indexes for common query patterns to improve performance

-- Index for trending page queries (ordered by article_published_at desc)
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc
ON articles(article_published_at DESC NULLS LAST);

-- Composite index for language + published_at queries (landing page)
CREATE INDEX IF NOT EXISTS idx_articles_language_published_views
ON articles(language, article_published_at DESC NULLS LAST, tweet_views DESC NULLS LAST)
WHERE summary_english IS NOT NULL AND summary_english != '';

-- Index for category filtering (used in trending page with category filter)
CREATE INDEX IF NOT EXISTS idx_articles_category_published
ON articles(category, article_published_at DESC NULLS LAST);

-- Index for author lookup pages
CREATE INDEX IF NOT EXISTS idx_articles_author_published
ON articles(author_handle, article_published_at DESC NULLS LAST);

-- Analyze the table to update statistics for query planner
ANALYZE articles;
