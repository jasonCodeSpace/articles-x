-- Cleanup unused tables and indexes

-- Drop daily_summary table and its policies (not used)
DROP TABLE IF EXISTS public.daily_summary CASCADE;

-- Drop unused indexes on twitter_lists
DROP INDEX IF EXISTS idx_twitter_lists_last_scanned;

-- Note: Keeping comments indexes as they may be used by RLS policies
-- idx_comments_user_id - used by RLS policies checking user_id
-- idx_comments_created_at - may be useful for sorting by date
