-- Ensure missing columns exist in articles table (idempotent)
BEGIN;

-- Add content column if missing (nullable for backward compatibility)
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS content TEXT;
COMMENT ON COLUMN public.articles.content IS 'Article body content (nullable for backfill; was NOT NULL in original schema)';

-- Add category column if missing
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS category TEXT;
COMMENT ON COLUMN public.articles.category IS 'Simple category label for filtering';

-- Create category index if missing
CREATE INDEX IF NOT EXISTS articles_category_idx ON public.articles (category);

COMMIT;