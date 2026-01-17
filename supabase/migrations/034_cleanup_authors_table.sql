-- Migration 034: Clean up authors table
-- Remove unnecessary columns as per new requirements
-- Keep only: id, handle, display_name, verified, profile_image_url

-- Drop the update trigger first
DROP TRIGGER IF EXISTS update_authors_updated_at_trigger ON authors;
DROP FUNCTION IF EXISTS update_authors_updated_at();

-- Drop unnecessary columns
ALTER TABLE authors DROP COLUMN IF EXISTS bio;
ALTER TABLE authors DROP COLUMN IF EXISTS followers_count;
ALTER TABLE authors DROP COLUMN IF EXISTS following_count;
ALTER TABLE authors DROP COLUMN IF EXISTS tweet_count;
ALTER TABLE authors DROP COLUMN IF EXISTS banner_image_url;
ALTER TABLE authors DROP COLUMN IF EXISTS location;
ALTER TABLE authors DROP COLUMN IF EXISTS website_url;
ALTER TABLE authors DROP COLUMN IF EXISTS created_at;
ALTER TABLE authors DROP COLUMN IF EXISTS updated_at;
ALTER TABLE authors DROP COLUMN IF EXISTS last_synced_at;

-- Drop indexes that are no longer needed
DROP INDEX IF EXISTS idx_authors_created_at;
DROP INDEX IF EXISTS idx_authors_followers_count;

-- Verify final schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'authors'
ORDER BY ordinal_position;
