-- Add Twitter-specific fields to articles table
-- This migration adds fields for Twitter integration as requested

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS tweet_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS tweet_text TEXT,
ADD COLUMN IF NOT EXISTS tweet_published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tweet_views_count INTEGER DEFAULT 0 CHECK (tweet_views_count >= 0),
ADD COLUMN IF NOT EXISTS tweet_replies_count INTEGER DEFAULT 0 CHECK (tweet_replies_count >= 0),
ADD COLUMN IF NOT EXISTS tweet_retweets_count INTEGER DEFAULT 0 CHECK (tweet_retweets_count >= 0),
ADD COLUMN IF NOT EXISTS tweet_likes_count INTEGER DEFAULT 0 CHECK (tweet_likes_count >= 0),
ADD COLUMN IF NOT EXISTS tweet_bookmarks_count INTEGER DEFAULT 0 CHECK (tweet_bookmarks_count >= 0),
ADD COLUMN IF NOT EXISTS article_preview_title TEXT,
ADD COLUMN IF NOT EXISTS article_preview_text TEXT,
ADD COLUMN IF NOT EXISTS full_article_content TEXT,
ADD COLUMN IF NOT EXISTS comments_data JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS raw_tweet_data JSONB,
ADD COLUMN IF NOT EXISTS list_id TEXT,
ADD COLUMN IF NOT EXISTS author_username TEXT,
ADD COLUMN IF NOT EXISTS author_avatar_url TEXT;

-- Create indexes for new Twitter-related fields
CREATE UNIQUE INDEX IF NOT EXISTS articles_tweet_id_idx ON public.articles (tweet_id) WHERE tweet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_tweet_published_at_idx ON public.articles (tweet_published_at);
CREATE INDEX IF NOT EXISTS articles_list_id_idx ON public.articles (list_id);
CREATE INDEX IF NOT EXISTS articles_tweet_views_count_idx ON public.articles (tweet_views_count);
CREATE INDEX IF NOT EXISTS articles_tweet_likes_count_idx ON public.articles (tweet_likes_count);
CREATE INDEX IF NOT EXISTS articles_author_username_idx ON public.articles (author_username);

-- Create compound indexes for common Twitter queries
CREATE INDEX IF NOT EXISTS articles_list_tweet_published_idx ON public.articles (list_id, tweet_published_at DESC);
CREATE INDEX IF NOT EXISTS articles_author_handle_tweet_published_idx ON public.articles (author_handle, tweet_published_at DESC);
CREATE INDEX IF NOT EXISTS articles_author_username_tweet_published_idx ON public.articles (author_username, tweet_published_at DESC);

-- Add comments for new columns
COMMENT ON COLUMN public.articles.tweet_id IS 'Unique Twitter tweet ID';
COMMENT ON COLUMN public.articles.tweet_text IS 'Original tweet text content';
COMMENT ON COLUMN public.articles.tweet_published_at IS 'When the tweet was published on Twitter';
COMMENT ON COLUMN public.articles.tweet_views_count IS 'Number of views on the tweet';
COMMENT ON COLUMN public.articles.tweet_replies_count IS 'Number of replies to the tweet';
COMMENT ON COLUMN public.articles.tweet_retweets_count IS 'Number of retweets';
COMMENT ON COLUMN public.articles.tweet_likes_count IS 'Number of likes on the tweet';
COMMENT ON COLUMN public.articles.tweet_bookmarks_count IS 'Number of bookmarks on the tweet';
COMMENT ON COLUMN public.articles.article_preview_title IS 'Article preview title from Twitter card';
COMMENT ON COLUMN public.articles.article_preview_text IS 'Article preview text from Twitter card';
COMMENT ON COLUMN public.articles.full_article_content IS 'Full article content extracted from tweet blocks';
COMMENT ON COLUMN public.articles.comments_data IS 'JSON array of comments and interactions';
COMMENT ON COLUMN public.articles.raw_tweet_data IS 'Raw API response data from Twitter';
COMMENT ON COLUMN public.articles.list_id IS 'Twitter list ID where this tweet was found';
COMMENT ON COLUMN public.articles.author_username IS 'Twitter username of the author';
COMMENT ON COLUMN public.articles.author_avatar_url IS 'URL to author\'s Twitter avatar image';