-- Enable Row Level Security for authors table
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to authors" ON authors
  FOR SELECT
  USING (true);

-- Create policy to allow insert/update for authenticated users (for admin operations)
CREATE POLICY "Allow insert/update for authenticated users" ON authors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);