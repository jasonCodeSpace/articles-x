-- Add author profile fields and article URL to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS author_handle TEXT,
ADD COLUMN IF NOT EXISTS author_profile_image TEXT,
ADD COLUMN IF NOT EXISTS article_url TEXT;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS articles_author_handle_idx ON public.articles (author_handle);
CREATE INDEX IF NOT EXISTS articles_article_url_idx ON public.articles (article_url);

-- Add comments for the new columns
COMMENT ON COLUMN public.articles.author_handle IS 'Author''s social media handle (e.g., @username)';
COMMENT ON COLUMN public.articles.author_profile_image IS 'URL to author''s profile image';
COMMENT ON COLUMN public.articles.article_url IS 'Direct link to the original article';