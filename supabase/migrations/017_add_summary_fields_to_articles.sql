-- Add summary fields to articles table for Gemini AI generated summaries

-- Add summary_chinese column for Chinese summary
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS summary_chinese TEXT;

-- Add summary_english column for English summary
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS summary_english TEXT;

-- Add summary_generated_at timestamp to track when summary was created
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP WITH TIME ZONE;

-- Add index on summary_generated_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_articles_summary_generated_at 
ON articles(summary_generated_at);

-- Add index on articles that have summaries (not null)
CREATE INDEX IF NOT EXISTS idx_articles_has_summary 
ON articles(id) WHERE summary_chinese IS NOT NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN articles.summary_chinese IS 'AI-generated Chinese summary of the article';
COMMENT ON COLUMN articles.summary_english IS 'AI-generated English summary of the article';
COMMENT ON COLUMN articles.summary_generated_at IS 'Timestamp when the AI summary was generated';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 017: Added summary fields (summary_chinese, summary_english, summary_generated_at) to articles table';
END $$;