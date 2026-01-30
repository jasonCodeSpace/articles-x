#!/usr/bin/env npx tsx
/**
 * Run database migration via HTTP
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceKey) {
  console.error('Missing credentials')
  process.exit(1)
}

async function runMigration() {
  const sql = `
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS indexed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS score NUMERIC NOT NULL DEFAULT 0;

    CREATE INDEX IF NOT EXISTS articles_indexed_idx ON articles (indexed);
    CREATE INDEX IF NOT EXISTS articles_score_idx ON articles (score DESC);
    CREATE INDEX IF NOT EXISTS articles_indexed_score_idx ON articles (indexed, score DESC);
  `

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({ sql })
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('Migration failed:', text)
    process.exit(1)
  }

  console.log('✅ Migration completed successfully!')
  console.log('Now run: npm run init:scores')
}

runMigration()
