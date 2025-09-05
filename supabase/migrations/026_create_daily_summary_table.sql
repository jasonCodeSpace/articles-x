-- Create daily_summary table for storing daily article summaries
CREATE TABLE daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  summary_content TEXT NOT NULL,
  top_article_title TEXT NOT NULL,
  top_article_id UUID,
  total_articles_count INTEGER DEFAULT 0,
  categories_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date for faster queries
CREATE INDEX idx_daily_summary_date ON daily_summary(date);

-- Create index on created_at for ordering
CREATE INDEX idx_daily_summary_created_at ON daily_summary(created_at);

-- Add foreign key constraint to articles table if top_article_id is provided
ALTER TABLE daily_summary 
ADD CONSTRAINT fk_daily_summary_top_article 
FOREIGN KEY (top_article_id) REFERENCES articles(id) ON DELETE SET NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;

-- Allow public read access to daily summaries
CREATE POLICY "Allow public read access to daily summaries" ON daily_summary
  FOR SELECT USING (true);

-- Only allow service role to insert/update daily summaries
CREATE POLICY "Allow service role to manage daily summaries" ON daily_summary
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_daily_summary_updated_at
  BEFORE UPDATE ON daily_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary_updated_at();