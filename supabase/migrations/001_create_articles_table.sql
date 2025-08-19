-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content fields
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- Metadata
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    
    -- Engagement metrics
    likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
    comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
    
    -- Publishing
    published_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- SEO and social
    meta_title TEXT,
    meta_description TEXT,
    featured_image_url TEXT,
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique_idx ON public.articles (slug);
CREATE INDEX IF NOT EXISTS articles_author_id_idx ON public.articles (author_id);
CREATE INDEX IF NOT EXISTS articles_status_idx ON public.articles (status);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles (published_at);
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON public.articles (created_at);
CREATE INDEX IF NOT EXISTS articles_likes_count_idx ON public.articles (likes_count);
CREATE INDEX IF NOT EXISTS articles_category_idx ON public.articles (category);
CREATE INDEX IF NOT EXISTS articles_tags_idx ON public.articles USING GIN (tags);

-- Create compound indexes for common queries
CREATE INDEX IF NOT EXISTS articles_status_published_at_idx ON public.articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS articles_author_status_idx ON public.articles (author_id, status);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow anyone to read published articles
CREATE POLICY "Anyone can read published articles"
ON public.articles
FOR SELECT
USING (status = 'published');

-- Block all writes (INSERT, UPDATE, DELETE) for regular users
-- Only service role or admin can perform writes
CREATE POLICY "Block all writes for regular users"
ON public.articles
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Allow service role to do everything (this policy will be automatically applied to service_role)
-- No explicit policy needed as service_role bypasses RLS by default

-- Grant necessary permissions
GRANT SELECT ON public.articles TO authenticated, anon;
GRANT ALL ON public.articles TO service_role;

-- Comment on table and important columns
COMMENT ON TABLE public.articles IS 'Articles table with RLS enabled - reads allowed for published articles, all writes blocked for regular users';
COMMENT ON COLUMN public.articles.slug IS 'Unique URL-friendly identifier';
COMMENT ON COLUMN public.articles.status IS 'Article status: draft, published, or archived';
COMMENT ON COLUMN public.articles.published_at IS 'When the article was published (null for drafts)';
COMMENT ON COLUMN public.articles.likes_count IS 'Number of likes (managed by triggers/functions)';
COMMENT ON COLUMN public.articles.tags IS 'Array of tags for categorization';