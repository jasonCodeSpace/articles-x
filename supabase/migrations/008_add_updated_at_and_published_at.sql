-- Ensure articles table has updated_at (for trigger) and add published_at with backfill and index
BEGIN;

-- Add updated_at to satisfy existing update_updated_at_column() trigger
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add published_at column
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.articles.published_at IS 'Canonical published datetime for the article; backfilled from published_time for compatibility.';

-- Backfill from published_time if available (trigger will now succeed because updated_at exists)
UPDATE public.articles
SET published_at = published_time
WHERE published_at IS NULL AND published_time IS NOT NULL;

-- Create index for sorting/filtering by published_at
CREATE INDEX IF NOT EXISTS articles_published_at_ts_idx ON public.articles (published_at);

COMMIT;