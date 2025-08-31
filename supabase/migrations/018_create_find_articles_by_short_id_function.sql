-- Create RPC function to find articles by short ID
CREATE OR REPLACE FUNCTION find_articles_by_short_id(short_id TEXT)
RETURNS TABLE(
  id UUID,
  title TEXT,
  article_preview_text TEXT,
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
  summary_generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.article_preview_text,
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
    a.summary_generated_at
  FROM articles a
  WHERE SUBSTRING(REPLACE(a.id::TEXT, '-', ''), 1, 6) = short_id;
END;
$$;