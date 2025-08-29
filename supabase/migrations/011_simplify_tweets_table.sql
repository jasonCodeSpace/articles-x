-- Simplify tweets table for new workflow
-- Drop existing tweets table and recreate with simplified structure
DROP TABLE IF EXISTS public.tweets CASCADE;

-- Create simplified tweets table
CREATE TABLE IF NOT EXISTS public.tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id TEXT UNIQUE NOT NULL,
  author_handle TEXT NOT NULL,
  has_article BOOLEAN DEFAULT FALSE,
  list_id TEXT NOT NULL, -- Which Twitter list this tweet came from
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tweets_tweet_id ON public.tweets(tweet_id);
CREATE INDEX IF NOT EXISTS idx_tweets_author_handle ON public.tweets(author_handle);
CREATE INDEX IF NOT EXISTS idx_tweets_has_article ON public.tweets(has_article);
CREATE INDEX IF NOT EXISTS idx_tweets_list_id ON public.tweets(list_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON public.tweets(created_at);

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

COMMENT ON TABLE public.tweets IS 'Simplified tweets table storing only essential tweet metadata';
COMMENT ON COLUMN public.tweets.tweet_id IS 'Twitter tweet ID';
COMMENT ON COLUMN public.tweets.author_handle IS 'Twitter handle of the tweet author (e.g., KemiBadenoch)';
COMMENT ON COLUMN public.tweets.has_article IS 'Whether this tweet contains an article (true/false)';
COMMENT ON COLUMN public.tweets.list_id IS 'ID of the Twitter list this tweet was fetched from';