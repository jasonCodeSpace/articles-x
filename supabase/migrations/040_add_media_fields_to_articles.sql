-- Add media content fields to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS article_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS article_videos TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.articles.article_images IS 'Array of image URLs extracted from the article';
COMMENT ON COLUMN public.articles.article_videos IS 'Array of video URLs/embeds extracted from the article';

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS articles_article_images_idx ON public.articles USING GIN (article_images);
CREATE INDEX IF NOT EXISTS articles_article_videos_idx ON public.articles USING GIN (article_videos);
