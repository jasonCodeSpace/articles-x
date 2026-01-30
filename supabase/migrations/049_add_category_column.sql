-- Add category column to articles table
-- This column will store the article category for filtering

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS category text;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category);

COMMENT ON COLUMN articles.category IS 'Article category (e.g., tech, business, product, science, culture)';
