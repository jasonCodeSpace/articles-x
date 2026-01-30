-- Add indexed and score fields to articles table
-- indexed: boolean indicating if article should be indexed and displayed on trending page
-- score: numeric score based on views/likes/comments/word count (0-100)

ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS indexed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS score NUMERIC NOT NULL DEFAULT 0;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS articles_indexed_idx ON public.articles (indexed);
CREATE INDEX IF NOT EXISTS articles_score_idx ON public.articles (score DESC);
CREATE INDEX IF NOT EXISTS articles_indexed_score_idx ON public.articles (indexed, score DESC);
CREATE INDEX IF NOT EXISTS articles_indexed_published_at_idx ON public.articles (indexed, article_published_at DESC);

-- Comment on new columns
COMMENT ON COLUMN public.articles.indexed IS 'Whether the article should be indexed and displayed on public pages';
COMMENT ON COLUMN public.articles.score IS 'Article score (0-100) based on engagement metrics and word count';
