-- Create web_vitals table for performance monitoring
CREATE TABLE IF NOT EXISTS web_vitals (
  id BIGSERIAL PRIMARY KEY,
  metric_name VARCHAR(50) NOT NULL,
  metric_value DECIMAL(10,3) NOT NULL,
  metric_delta DECIMAL(10,3),
  metric_id VARCHAR(255) NOT NULL,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  country VARCHAR(2),
  city VARCHAR(100),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON web_vitals(created_at);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_url ON web_vitals(page_url);
CREATE INDEX IF NOT EXISTS idx_web_vitals_timestamp ON web_vitals(timestamp);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_date ON web_vitals(metric_name, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE web_vitals IS 'Stores Web Vitals performance metrics for monitoring';
COMMENT ON COLUMN web_vitals.metric_name IS 'Name of the Web Vital metric (LCP, FID, CLS, FCP, TTFB)';
COMMENT ON COLUMN web_vitals.metric_value IS 'Value of the metric in appropriate units';
COMMENT ON COLUMN web_vitals.metric_delta IS 'Delta value since last measurement';
COMMENT ON COLUMN web_vitals.metric_id IS 'Unique identifier for this metric instance';
COMMENT ON COLUMN web_vitals.page_url IS 'URL where the metric was measured';
COMMENT ON COLUMN web_vitals.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN web_vitals.ip_address IS 'Client IP address (anonymized)';
COMMENT ON COLUMN web_vitals.country IS 'Country code from geo data';
COMMENT ON COLUMN web_vitals.city IS 'City from geo data';
COMMENT ON COLUMN web_vitals.timestamp IS 'When the metric was recorded on client';
COMMENT ON COLUMN web_vitals.created_at IS 'When the record was inserted into database';

-- Enable Row Level Security (RLS)
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for analytics
CREATE POLICY "Allow public read access to web_vitals" ON web_vitals
  FOR SELECT USING (true);

-- Create policy to allow public insert for metric collection
CREATE POLICY "Allow public insert to web_vitals" ON web_vitals
  FOR INSERT WITH CHECK (true);

-- Create a function to clean up old web vitals data (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_web_vitals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM web_vitals 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for performance summary
CREATE OR REPLACE VIEW web_vitals_summary AS
SELECT 
  metric_name,
  COUNT(*) as total_measurements,
  ROUND(AVG(metric_value), 2) as avg_value,
  ROUND(MIN(metric_value), 2) as min_value,
  ROUND(MAX(metric_value), 2) as max_value,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value), 2) as p50,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value), 2) as p75,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value), 2) as p95,
  DATE_TRUNC('day', created_at) as date
FROM web_vitals 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY metric_name, DATE_TRUNC('day', created_at)
ORDER BY date DESC, metric_name;

COMMENT ON VIEW web_vitals_summary IS 'Daily summary of Web Vitals metrics for the last 30 days';