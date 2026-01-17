#!/usr/bin/env npx tsx
/**
 * 从本地 JSON 文件恢复文章到 Supabase
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const client = createClient(SUPABASE_URL, SUPABASE_KEY)

async function restoreArticles() {
  const archiveDir = 'data/archive'
  const files = fs.readdirSync(archiveDir).filter(f => f.endsWith('.json'))

  console.log(`📦 Found ${files.length} archive files\n`)

  let totalRestored = 0
  let totalSkipped = 0

  for (const file of files) {
    const filepath = path.join(archiveDir, file)
    const content = fs.readFileSync(filepath, 'utf-8')
    const articles = JSON.parse(content)

    console.log(`📄 ${file}: ${articles.length} articles`)

    // Batch upsert (500 at a time)
    const batchSize = 500
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)

      const { error, count } = await client
        .from('articles')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })

      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
      } else {
        totalRestored += batch.length
        process.stdout.write(`   ✅ Restored ${Math.min(i + batchSize, articles.length)}/${articles.length}\r`)
      }
    }
    console.log('')
  }

  // Get final count
  const { count } = await client
    .from('articles')
    .select('*', { count: 'exact', head: true })

  console.log(`\n✨ Done! Total articles in DB: ${count}`)
}

restoreArticles().catch(console.error)
