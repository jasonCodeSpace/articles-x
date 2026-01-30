#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function runMigration() {
  console.log('Running migration: Add category column...')

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      sql: `ALTER TABLE articles ADD COLUMN IF NOT EXISTS category text;`
    })
  })

  const result = await response.text()
  console.log('Add column result:', result)

  // Create index
  const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      sql: `CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category);`
    })
  })

  const result2 = await response2.text()
  console.log('Create index result:', result2)

  console.log('Migration completed!')
}

runMigration().catch(console.error)
