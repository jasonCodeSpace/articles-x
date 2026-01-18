-- Add rest_id column to authors table
ALTER TABLE authors ADD COLUMN IF NOT EXISTS rest_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_authors_rest_id ON authors(rest_id);

-- Add unique constraint on rest_id
ALTER TABLE authors ADD CONSTRAINT authors_rest_id_unique UNIQUE (rest_id);
