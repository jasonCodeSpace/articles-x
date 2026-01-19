-- Create RPC function to refresh article_stats materialized view
-- This allows GitHub Action to refresh stats via REST API

CREATE OR REPLACE FUNCTION public.refresh_article_stats()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.article_stats;
$$;

-- Grant execute to service_role only (for GitHub Action)
-- Note: anon and authenticated are NOT granted for security
GRANT EXECUTE ON FUNCTION public.refresh_article_stats() TO service_role;

COMMENT ON FUNCTION public.refresh_article_stats() IS 'Refresh article_stats materialized view - called by GitHub Action every 6 hours';
