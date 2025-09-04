-- Fix function search_path security issues
-- Add SECURITY DEFINER and SET search_path to all functions

-- 1. Fix assign_article_tag function
CREATE OR REPLACE FUNCTION assign_article_tag(published_at TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF published_at IS NULL THEN
        RETURN 'History';
    END IF;
    
    IF published_at >= NOW() - INTERVAL '24 hours' THEN
        RETURN 'Day';
    ELSIF published_at >= NOW() - INTERVAL '7 days' THEN
        RETURN 'Week';
    ELSE
        RETURN 'History';
    END IF;
END;
$$;

-- 2. Fix update_article_tag function
CREATE OR REPLACE FUNCTION update_article_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.tag := assign_article_tag(NEW.article_published_at);
    RETURN NEW;
END;
$$;

-- 3. Fix auto_fix_article_slug function
CREATE OR REPLACE FUNCTION auto_fix_article_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fix slug if it doesn't match the correct format
  IF NEW.slug IS NULL OR NEW.slug !~ '--[a-f0-9]{6}$' OR SUBSTRING(NEW.slug FROM '.*--(.*)$') != LEFT(REPLACE(NEW.id::text, '-', ''), 6) THEN
    NEW.slug := CONCAT(
      -- Clean title: use English title if available, otherwise use original title
      -- lowercase, replace spaces and special chars with hyphens, remove multiple hyphens
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            LOWER(COALESCE(NEW.title_english, NEW.title)), 
            '[^a-z0-9\\s-]', '', 'g'
          ), 
          '\\s+', '-', 'g'
        ), 
        '-+', '-', 'g'
      ),
      '--',
      -- Short ID: first 6 characters of UUID without hyphens
      LEFT(REPLACE(NEW.id::text, '-', ''), 6)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Fix cleanup_non_article_tweets function
CREATE OR REPLACE FUNCTION cleanup_non_article_tweets()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete tweets where has_article is false
    DELETE FROM tweets 
    WHERE has_article = false;
    
    -- Get the count of deleted rows
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- 5. Fix find_articles_by_short_id function
CREATE OR REPLACE FUNCTION find_articles_by_short_id(short_id TEXT)
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
  summary_generated_at TIMESTAMPTZ
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
    a.summary_generated_at
  FROM articles a
  WHERE SUBSTRING(REPLACE(a.id::TEXT, '-', ''), 1, 6) = short_id;
END;
$$;

-- 6. Fix get_broken_slugs function
CREATE OR REPLACE FUNCTION get_broken_slugs()
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  tweet_id TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.title, a.slug, a.tweet_id
  FROM articles a
  WHERE a.slug LIKE '%--______'
    AND SPLIT_PART(a.slug, '--', 1) NOT LIKE '%-%'
    AND LENGTH(SPLIT_PART(a.slug, '--', 1)) > 10
  ORDER BY a.updated_at DESC;
$$;

-- 7. Fix get_unprocessed_tweets function
CREATE OR REPLACE FUNCTION get_unprocessed_tweets(limit_count INTEGER)
RETURNS TABLE(
  tweet_id TEXT,
  created_at TIMESTAMPTZ,
  author_handle TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.tweet_id, t.created_at, t.author_handle
  FROM tweets t
  LEFT JOIN articles a ON t.tweet_id = a.tweet_id
  WHERE t.has_article = true
    AND a.tweet_id IS NULL
  ORDER BY t.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 8. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 9. Fix update_authors_updated_at function
CREATE OR REPLACE FUNCTION update_authors_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 10. Fix update_twitter_lists_updated_at function
CREATE OR REPLACE FUNCTION update_twitter_lists_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION assign_article_tag(TIMESTAMPTZ) IS 'Assigns article tag based on publication date - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION update_article_tag() IS 'Trigger function to update article tag - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION auto_fix_article_slug() IS 'Trigger function to auto-fix article slugs - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION cleanup_non_article_tweets() IS 'Cleans up non-article tweets - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION find_articles_by_short_id(TEXT) IS 'Finds articles by short ID - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION get_broken_slugs() IS 'Gets articles with broken slugs - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION get_unprocessed_tweets(INTEGER) IS 'Gets unprocessed tweets - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to update updated_at column - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION update_authors_updated_at() IS 'Trigger function to update authors updated_at - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION update_twitter_lists_updated_at() IS 'Trigger function to update twitter_lists updated_at - SECURITY DEFINER with fixed search_path';