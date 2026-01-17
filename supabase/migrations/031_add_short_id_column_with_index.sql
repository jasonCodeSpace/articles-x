-- RPC function to find articles by short_id (first 6 chars of UUID)
-- Computes short_id dynamically - no additional column needed
-- Using only columns that actually exist in the database

CREATE OR REPLACE FUNCTION find_articles_by_short_id(p_short_id TEXT)
RETURNS TABLE(
  id UUID,
  title TEXT,
  title_english TEXT,
  slug TEXT,
  full_article_content TEXT,
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
  tag TEXT,
  tweet_id TEXT,
  tweet_text TEXT,
  tweet_published_at TIMESTAMPTZ,
  tweet_views INTEGER,
  tweet_replies INTEGER,
  tweet_likes INTEGER,
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
    a.slug,
    a.full_article_content,
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
    a.tag,
    a.tweet_id,
    a.tweet_text,
    a.tweet_published_at,
    a.tweet_views,
    a.tweet_replies,
    a.tweet_likes,
    a.language
  FROM articles a
  WHERE SUBSTRING(REPLACE(a.id::TEXT, '-', ''), 1, 6) = p_short_id
  ORDER BY a.article_published_at DESC NULLS LAST, a.id DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_articles_by_short_id(TEXT) TO authenticated, anon;
