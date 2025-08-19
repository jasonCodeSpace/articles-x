-- Create tweets table to store all fetched tweets
CREATE TABLE IF NOT EXISTS public.tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id TEXT UNIQUE NOT NULL,
  rest_id TEXT,
  author_handle TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_profile_image TEXT,
  tweet_text TEXT NOT NULL,
  created_at_twitter TEXT NOT NULL, -- Original Twitter timestamp
  has_article BOOLEAN DEFAULT FALSE,
  article_url TEXT,
  article_title TEXT,
  article_excerpt TEXT,
  article_featured_image TEXT,
  article_rest_id TEXT,
  list_id TEXT NOT NULL, -- Which Twitter list this tweet came from
  raw_data JSONB, -- Store the complete raw tweet data
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tweets_tweet_id ON public.tweets(tweet_id);
CREATE INDEX IF NOT EXISTS idx_tweets_author_handle ON public.tweets(author_handle);
CREATE INDEX IF NOT EXISTS idx_tweets_has_article ON public.tweets(has_article);
CREATE INDEX IF NOT EXISTS idx_tweets_list_id ON public.tweets(list_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON public.tweets(created_at_twitter);
CREATE INDEX IF NOT EXISTS idx_tweets_processed_at ON public.tweets(processed_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tweets_updated_at BEFORE UPDATE ON public.tweets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow service role to do everything
CREATE POLICY "Service role can manage tweets" ON public.tweets
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read tweets
CREATE POLICY "Authenticated users can read tweets" ON public.tweets
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anonymous users to read tweets (for public access)
CREATE POLICY "Anonymous users can read tweets" ON public.tweets
  FOR SELECT USING (auth.role() = 'anon');

COMMENT ON TABLE public.tweets IS 'Stores all fetched tweets from Twitter lists';
COMMENT ON COLUMN public.tweets.tweet_id IS 'Twitter tweet ID (id_str)';
COMMENT ON COLUMN public.tweets.rest_id IS 'Twitter REST API ID';
COMMENT ON COLUMN public.tweets.has_article IS 'Whether this tweet contains an article';
COMMENT ON COLUMN public.tweets.raw_data IS 'Complete raw tweet data from Twitter API';
COMMENT ON COLUMN public.tweets.list_id IS 'ID of the Twitter list this tweet was fetched from';