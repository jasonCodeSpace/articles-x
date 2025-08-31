-- Remove tweet_text_english column from articles table
ALTER TABLE articles DROP COLUMN IF EXISTS tweet_text_english;

-- Remove any indexes related to tweet_text_english if they exist
DROP INDEX IF EXISTS idx_articles_tweet_text_english;