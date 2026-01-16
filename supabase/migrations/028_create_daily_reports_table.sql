-- Create daily_reports table for storing AI-generated daily summaries
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  report_chinese TEXT,
  report_english TEXT,
  article_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date DESC);

-- Add RLS policies
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on daily_reports"
  ON daily_reports
  FOR SELECT
  TO public
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on daily_reports"
  ON daily_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
