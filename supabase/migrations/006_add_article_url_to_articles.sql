-- Add article_url column to articles table
-- This column stores the original article URL from Twitter articles

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS article_url TEXT;

-- Add index for article_url to improve query performance
CREATE INDEX IF NOT EXISTS articles_article_url_idx ON public.articles (article_url);

-- Add comment to document the column purpose
COMMENT ON COLUMN public.articles.article_url IS 'The original URL of the article as referenced from Twitter';