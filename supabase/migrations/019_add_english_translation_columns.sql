-- Add English translation columns to articles table
ALTER TABLE articles 
ADD COLUMN title_english TEXT,
ADD COLUMN tweet_text_english TEXT,
ADD COLUMN article_preview_text_english TEXT,
ADD COLUMN full_article_content_english TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_title_english ON articles(title_english);
CREATE INDEX IF NOT EXISTS idx_articles_language_title_english ON articles(language, title_english);

-- Add comment for documentation
COMMENT ON COLUMN articles.title_english IS 'English translation of the article title';
COMMENT ON COLUMN articles.tweet_text_english IS 'English translation of the tweet text';
COMMENT ON COLUMN articles.article_preview_text_english IS 'English translation of the article preview text';
COMMENT ON COLUMN articles.full_article_content_english IS 'English translation of the full article content';