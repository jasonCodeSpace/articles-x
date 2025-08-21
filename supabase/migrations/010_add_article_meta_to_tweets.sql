-- Add article metadata columns to tweets for richer migration and analytics
ALTER TABLE public.tweets
  ADD COLUMN IF NOT EXISTS article_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_tweets_article_published_at ON public.tweets(article_published_at);
CREATE INDEX IF NOT EXISTS idx_tweets_category ON public.tweets(category);

-- Comments for clarity
COMMENT ON COLUMN public.tweets.article_published_at IS 'Original article published time (from Twitter article metadata when available)';
COMMENT ON COLUMN public.tweets.category IS 'Category label for the article associated with this tweet (e.g., twitter-import)';