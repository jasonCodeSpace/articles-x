-- Create twitter_lists table for managing Twitter list scanning
CREATE TABLE IF NOT EXISTS public.twitter_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_scanned_at TIMESTAMPTZ,
  articles_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_twitter_lists_status ON public.twitter_lists(status);
CREATE INDEX IF NOT EXISTS idx_twitter_lists_last_scanned ON public.twitter_lists(last_scanned_at);

-- Enable RLS
ALTER TABLE public.twitter_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read twitter_lists" ON public.twitter_lists
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update twitter_lists" ON public.twitter_lists
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow service role to manage twitter_lists" ON public.twitter_lists
  FOR ALL TO service_role USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_twitter_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_twitter_lists_updated_at
  BEFORE UPDATE ON public.twitter_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_twitter_lists_updated_at();