-- Create materialized view for article statistics
-- This provides fast O(1) lookups for counts without scanning the entire articles table

CREATE MATERIALIZED VIEW IF NOT EXISTS public.article_stats AS
SELECT
  1 as id,
  (SELECT count(*) FROM public.articles WHERE status = 'published') as total_published,
  (SELECT count(*) FROM public.articles WHERE status = 'published' AND language = 'en') as total_english,
  (SELECT count(*) FROM public.articles WHERE status = 'published' AND article_published_at >= now() - interval '7 days') as published_last_7days,
  now() as updated_at;

-- Create unique index on id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_stats_id ON public.article_stats(id);

-- Grant read access to public
GRANT SELECT ON public.article_stats TO authenticated, anon;

-- Comment
COMMENT ON MATERIALIZED VIEW public.article_stats IS 'Cached article statistics - refresh daily via REFRESH MATERIALIZED VIEW public.article_stats;';
