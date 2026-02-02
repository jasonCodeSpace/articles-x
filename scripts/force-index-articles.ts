#!/usr/bin/env npx tsx
/**
 * Force index specific articles by tweet ID
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createServiceRoleClient } from '../lib/services/database/client'

// Tweet IDs of articles to force index
const TWEET_IDS = [
  '2017603416898596957',  // 币圈之外尝试的一些副业 (score: 59)
  '2017557944892797438',  // Why Your Post Reach Is So Low (score: 57)
]

async function main() {
  const client = createServiceRoleClient()

  console.log('========================================')
  console.log('Force indexing articles')
  console.log('========================================')

  for (const tweetId of TWEET_IDS) {
    console.log(`\nProcessing tweet ${tweetId}...`)

    // First, get the article to see its current state
    const { data: article, error: fetchError } = await client
      .from('articles')
      .select('*')
      .eq('tweet_id', tweetId)
      .single()

    if (fetchError) {
      console.error(`  Error fetching article:`, fetchError)
      continue
    }

    console.log(`  Found: "${article.title}"`)
    console.log(`  Current: score=${article.score}, indexed=${article.indexed}`)

    if (article.indexed) {
      console.log(`  Already indexed, skipping...`)
      continue
    }

    // Update to set indexed = true
    const { error: updateError } = await client
      .from('articles')
      .update({ indexed: true })
      .eq('tweet_id', tweetId)

    if (updateError) {
      console.error(`  Error updating:`, updateError)
    } else {
      console.log(`  ✓ Force indexed successfully!`)
    }
  }

  console.log('\n========================================')
  console.log('Done!')
  console.log('========================================')
}

main().catch(console.error)
