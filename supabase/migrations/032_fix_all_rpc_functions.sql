-- Fix all RPC functions to use correct table name (articles) and column names
-- Run this in Supabase SQL Editor

-- 1. find_articles_by_short_id - for article lookup by short ID
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

GRANT EXECUTE ON FUNCTION find_articles_by_short_id(TEXT) TO authenticated, anon;

-- 2. get_previous_article - for article navigation
CREATE OR REPLACE FUNCTION get_previous_article(current_article_id UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  title_english TEXT,
  slug TEXT,
  image TEXT,
  author_name TEXT,
  author_handle TEXT,
  article_published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_date TIMESTAMPTZ;
BEGIN
  -- Get the published date of the current article
  SELECT a.article_published_at INTO current_date
  FROM articles a
  WHERE a.id = current_article_id;

  -- Return the previous article (older than current)
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.title_english,
    a.slug,
    a.image,
    a.author_name,
    a.author_handle,
    a.article_published_at
  FROM articles a
  WHERE a.article_published_at < current_date
    OR (a.article_published_at = current_date AND a.id < current_article_id)
  ORDER BY a.article_published_at DESC, a.id DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_previous_article(UUID) TO authenticated, anon;

-- 3. get_next_article - for article navigation
CREATE OR REPLACE FUNCTION get_next_article(current_article_id UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  title_english TEXT,
  slug TEXT,
  image TEXT,
  author_name TEXT,
  author_handle TEXT,
  article_published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_date TIMESTAMPTZ;
BEGIN
  -- Get the published date of the current article
  SELECT a.article_published_at INTO current_date
  FROM articles a
  WHERE a.id = current_article_id;

  -- Return the next article (newer than current)
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.title_english,
    a.slug,
    a.image,
    a.author_name,
    a.author_handle,
    a.article_published_at
  FROM articles a
  WHERE a.article_published_at > current_date
    OR (a.article_published_at = current_date AND a.id > current_article_id)
  ORDER BY a.article_published_at ASC, a.id ASC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_article(UUID) TO authenticated, anon;
