-- Add source_type field to distinguish manually inserted articles
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'auto' CHECK (source_type IN ('auto', 'manual'));

COMMENT ON COLUMN public.articles.source_type IS 'Source type: auto = automatically fetched from X, manual = manually inserted by admin';

-- Create index for filtering by source_type
CREATE INDEX IF NOT EXISTS articles_source_type_idx ON public.articles (source_type);

-- Add manually_inserted_at field to track when article was manually inserted
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS manually_inserted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.articles.manually_inserted_at IS 'Timestamp when article was manually inserted (null for auto-fetched articles)';
