-- Add published_at column to articles, backfill from existing published_time, and index it
BEGIN;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.articles.published_at IS 'Canonical published datetime for the article; backfilled from published_time for compatibility.';

-- Backfill from published_time if available
UPDATE public.articles
SET published_at = published_time
WHERE published_at IS NULL AND published_time IS NOT NULL;

-- Create index for sorting/filtering by published_at
CREATE INDEX IF NOT EXISTS articles_published_at_ts_idx ON public.articles (published_at);

COMMIT;