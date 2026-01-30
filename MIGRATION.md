# Database Migration Required

## Step 1: Run SQL Migration

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Add score and indexed columns
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS indexed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS score NUMERIC NOT NULL DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS articles_indexed_idx ON articles (indexed);
CREATE INDEX IF NOT EXISTS articles_score_idx ON articles (score DESC);
CREATE INDEX IF NOT EXISTS articles_indexed_score_idx ON articles (indexed, score DESC);
CREATE INDEX IF NOT EXISTS articles_indexed_published_at_idx ON articles (indexed, article_published_at DESC);

-- Add comments
COMMENT ON COLUMN articles.indexed IS 'Whether the article should be displayed on trending page';
COMMENT ON COLUMN articles.score IS 'Article quality score (0-100) based on views, likes, replies, and word count';
```

## Step 2: Initialize Scores

After running the migration, initialize scores:

```bash
npm run init:scores
```

## Step 3: Update package.json

Add the init script:

```json
"scripts": {
  "init:scores": "tsx scripts/init-article-scores-v2.ts"
}
```

## Pipeline Flow

1. **Article Pipeline** (`workflow:articles`)
   - Fetch tweets → Extract articles → Save to DB → Generate summaries

2. **Daily Quota** (`workflow:daily-quota`) at 23:50
   - Ensures 5-7 articles indexed on trending

3. **Daily Indexing** (`workflow:daily-indexing`)
   - Updates global top 5 based on score

## Cron Jobs

```bash
# Every 15 minutes - fetch new articles
*/15 * * * * cd /path/to/xarticle && npm run workflow:articles

# Daily 23:50 - adjust quota (5-7 articles)
50 23 * * * cd /path/to/xarticle && npm run workflow:daily-quota
```
