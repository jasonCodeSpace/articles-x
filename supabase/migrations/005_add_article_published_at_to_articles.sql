-- Add missing article_published_at column to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS article_published_at TIMESTAMPTZ;

-- Optional index for queries by article published time
CREATE INDEX IF NOT EXISTS articles_article_published_at_idx
ON public.articles (article_published_at);

COMMENT ON COLUMN public.articles.article_published_at IS 'Original article published date (may differ from tweet published date)';