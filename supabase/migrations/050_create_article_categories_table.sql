-- Create article_categories junction table for many-to-many relationship
-- This allows articles to have multiple categories while maintaining backwards compatibility

-- Create the junction table
CREATE TABLE IF NOT EXISTS public.article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,  -- e.g., 'tech:ai'
  is_primary BOOLEAN DEFAULT FALSE,  -- Mark the primary category for URL generation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, category)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_article_categories_article ON public.article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_category ON public.article_categories(category);
CREATE INDEX IF NOT EXISTS idx_article_categories_is_primary ON public.article_categories(is_primary);

-- Add comments for documentation
COMMENT ON TABLE public.article_categories IS 'Junction table for many-to-many relationship between articles and categories';
COMMENT ON COLUMN public.article_categories.category IS 'Category in format "main:sub" (e.g., "tech:ai")';
COMMENT ON COLUMN public.article_categories.is_primary IS 'Primary category used for URL generation';

-- Enable RLS (optional - adjust based on your security requirements)
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Public can read article categories" ON public.article_categories;
DROP POLICY IF EXISTS "Service role can manage article categories" ON public.article_categories;

-- Create RLS policies (read-only for public)
CREATE POLICY "Public can read article categories"
  ON public.article_categories
  FOR SELECT
  TO public
  USING (true);

-- Service role can insert/update
CREATE POLICY "Service role can manage article categories"
  ON public.article_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
