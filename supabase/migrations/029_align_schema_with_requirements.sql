-- Migration 029: Align schema with new requirements
-- Renaming metrics columns to match the requested output schema
-- Dropping redundant fields

-- Rename metrics columns
ALTER TABLE public.articles RENAME COLUMN tweet_views_count TO tweet_views;
ALTER TABLE public.articles RENAME COLUMN tweet_replies_count TO tweet_replies;
ALTER TABLE public.articles RENAME COLUMN tweet_retweets_count TO tweet_retweets;
ALTER TABLE public.articles RENAME COLUMN tweet_likes_count TO tweet_likes;
ALTER TABLE public.articles RENAME COLUMN tweet_bookmarks_count TO tweet_bookmarks;

-- Drop article_preview_text as it is redundant
ALTER TABLE public.articles DROP COLUMN IF EXISTS article_preview_text;

-- Update indexes to use new column names (Postgres usually handles renaming in indexes automatically, but good to document)
-- The existing indexes were:
-- articles_tweet_views_count_idx
-- articles_tweet_likes_count_idx
-- Postgres renames the index column usage, but the index NAME sticks.
-- We might want to rename indexes for consistency, though not strictly required.
ALTER INDEX IF EXISTS articles_tweet_views_count_idx RENAME TO articles_tweet_views_idx;
ALTER INDEX IF EXISTS articles_tweet_likes_count_idx RENAME TO articles_tweet_likes_idx;
