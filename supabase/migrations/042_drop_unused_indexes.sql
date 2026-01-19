-- Drop unused/redundant indexes to improve write performance and reduce storage

-- 1. Drop idx_web_vitals_timestamp - redundant with idx_web_vitals_created_at
-- timestamp and created_at serve the same purpose for this table
DROP INDEX IF EXISTS idx_web_vitals_timestamp;

-- 2. Drop idx_authors_handle - redundant with UNIQUE constraint on handle column
-- PostgreSQL automatically creates a unique index for UNIQUE constraints
DROP INDEX IF EXISTS idx_authors_handle;

-- 3. Drop idx_daily_summary_created_at - unused index
DROP INDEX IF EXISTS idx_daily_summary_created_at;

-- Note: Comments indexes (idx_comments_user_id, idx_comments_created_at)
-- and twitter_lists index (idx_twitter_lists_last_scanned) are kept
-- as they may be used by background jobs or future features
