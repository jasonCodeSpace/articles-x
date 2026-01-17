-- Migration 037: Drop tweets table
-- Tweets are no longer stored separately - articles table contains all needed data

-- Drop the tweets table
DROP TABLE IF EXISTS tweets CASCADE;

-- Note: Any related functions or triggers that reference tweets will also be dropped
-- due to the CASCADE option
