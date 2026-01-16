-- Create articles_page_1 table (first 1000 articles by published date desc)
CREATE TABLE articles_page_1 (
  LIKE articles INCLUDING ALL
);

-- Create articles_page_2 table (articles 1001-2000 by published date desc)
CREATE TABLE articles_page_2 (
  LIKE articles INCLUDING ALL
);

-- Enable RLS on both new tables
ALTER TABLE articles_page_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles_page_2 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for articles_page_1 (allow public read access)
CREATE POLICY "Allow public read access on articles_page_1" ON articles_page_1
  FOR SELECT USING (true);

-- Create RLS policies for articles_page_2 (allow public read access)
CREATE POLICY "Allow public read access on articles_page_2" ON articles_page_2
  FOR SELECT USING (true);

-- Insert first 1000 articles (by published date desc) into articles_page_1
INSERT INTO articles_page_1
SELECT * FROM articles
WHERE article_published_at IS NOT NULL
ORDER BY article_published_at DESC
LIMIT 1000;

-- Insert articles 1001-2000 (by published date desc) into articles_page_2
INSERT INTO articles_page_2
SELECT * FROM articles
WHERE article_published_at IS NOT NULL
ORDER BY article_published_at DESC
LIMIT 1000 OFFSET 1000;

-- Create indexes for better performance
CREATE INDEX idx_articles_page_1_published_at ON articles_page_1(article_published_at DESC);
CREATE INDEX idx_articles_page_2_published_at ON articles_page_2(article_published_at DESC);
CREATE INDEX idx_articles_page_1_id ON articles_page_1(id);
CREATE INDEX idx_articles_page_2_id ON articles_page_2(id);

-- Create function to search across all article tables
CREATE OR REPLACE FUNCTION search_all_articles(
  search_term TEXT DEFAULT '',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  summary_chinese TEXT,
  article_preview_text TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  category TEXT,
  article_published_at TIMESTAMPTZ,
  is_archived BOOLEAN,
  image TEXT,
  table_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      a.id,
      a.title,
      a.slug,
      a.summary_chinese,
      a.article_preview_text,
      a.author_name,
      a.author_avatar_url,
      a.category,
      a.article_published_at,
      a.is_archived,
      a.image,
      'articles'::TEXT as table_source
    FROM articles a
    WHERE 
      a.article_published_at < NOW() - INTERVAL '7 days'
      AND (
        search_term = '' OR
        a.title ILIKE '%' || search_term || '%' OR
        a.summary_chinese ILIKE '%' || search_term || '%' OR
        a.article_preview_text ILIKE '%' || search_term || '%'
      )
    
    UNION ALL
    
    SELECT 
      ap1.id,
      ap1.title,
      ap1.slug,
      ap1.summary_chinese,
      ap1.article_preview_text,
      ap1.author_name,
      ap1.author_avatar_url,
      ap1.category,
      ap1.article_published_at,
      ap1.is_archived,
      ap1.image,
      'articles_page_1'::TEXT as table_source
    FROM articles_page_1 ap1
    WHERE 
      ap1.article_published_at < NOW() - INTERVAL '7 days'
      AND (
        search_term = '' OR
        ap1.title ILIKE '%' || search_term || '%' OR
        ap1.summary_chinese ILIKE '%' || search_term || '%' OR
        ap1.article_preview_text ILIKE '%' || search_term || '%'
      )
    
    UNION ALL
    
    SELECT 
      ap2.id,
      ap2.title,
      ap2.slug,
      ap2.summary_chinese,
      ap2.article_preview_text,
      ap2.author_name,
      ap2.author_avatar_url,
      ap2.category,
      ap2.article_published_at,
      ap2.is_archived,
      ap2.image,
      'articles_page_2'::TEXT as table_source
    FROM articles_page_2 ap2
    WHERE 
      ap2.article_published_at < NOW() - INTERVAL '7 days'
      AND (
        search_term = '' OR
        ap2.title ILIKE '%' || search_term || '%' OR
        ap2.summary_chinese ILIKE '%' || search_term || '%' OR
        ap2.article_preview_text ILIKE '%' || search_term || '%'
      )
  )
  ORDER BY article_published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;