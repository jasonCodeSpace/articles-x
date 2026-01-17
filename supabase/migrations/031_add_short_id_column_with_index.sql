-- Add short_id generated column for fast article lookups
-- This column stores the first 6 characters of the UUID without dashes

-- Add the short_id column as a generated column
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS short_id TEXT GENERATED ALWAYS AS (
  SUBSTRING(REPLACE(id::TEXT, '-', ''), 1, 6)
) STORED;

-- Create index on short_id for O(1) lookups
CREATE INDEX IF NOT EXISTS idx_articles_short_id ON articles(short_id);

-- Update the RPC function to use the indexed column
CREATE OR REPLACE FUNCTION find_articles_by_short_id(p_short_id TEXT)
RETURNS TABLE(
  id UUID,
  title TEXT,
  title_english TEXT,
  article_preview_text TEXT,
  article_preview_text_english TEXT,
  full_article_content TEXT,
  full_article_content_english TEXT,
  article_url TEXT,
  image TEXT,
  category TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_avatar TEXT,
  article_published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  summary_english TEXT,
  summary_chinese TEXT,
  summary_generated_at TIMESTAMPTZ,
  tags TEXT[],
  tweet_views INTEGER,
  tweet_replies INTEGER,
  tweet_retweets INTEGER,
  tweet_likes INTEGER,
  tweet_bookmarks INTEGER,
  language TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.title_english,
    a.article_preview_text,
    a.article_preview_text_english,
    a.full_article_content,
    a.full_article_content_english,
    a.article_url,
    a.image,
    a.category,
    a.author_name,
    a.author_handle,
    a.author_avatar,
    a.article_published_at,
    a.updated_at,
    a.summary_english,
    a.summary_chinese,
    a.summary_generated_at,
    a.tags,
    a.tweet_views,
    a.tweet_replies,
    a.tweet_retweets,
    a.tweet_likes,
    a.tweet_bookmarks,
    a.language
  FROM articles a
  WHERE a.short_id = p_short_id
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_articles_by_short_id(TEXT) TO authenticated, anon;
