#!/usr/bin/env npx tsx
/**
 * Fetch a single article from X URL and save to database
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createTwitterClient } from '../lib/services/twitter'
import { mapTweetToArticle, batchUpsertArticles } from '../lib/services/article'

const URL = process.argv[2] || 'https://x.com/Shelpid_WI3M/status/2017938351576215802'

// Extract tweet ID from URL
function extractTweetId(url: string): string {
  const match = url.match(/(\d{15,})/)
  return match ? match[1] : ''
}

async function main() {
  const client = createTwitterClient()

  console.log('========================================')
  console.log('Fetching article from X')
  console.log('========================================')
  console.log(`URL: ${URL}\n`)

  const tweetId = extractTweetId(URL)
  if (!tweetId) {
    console.error(`Could not extract tweet ID from: ${URL}`)
    process.exit(1)
  }

  console.log(`Fetching tweet ${tweetId}...`)

  try {
    const tweet = await client.fetchTweet(tweetId)
    if (!tweet) {
      console.error(`No data returned for tweet ${tweetId}`)
      process.exit(1)
    }

    const article = mapTweetToArticle(tweet)
    if (!article) {
      console.error(`Could not map tweet to article (not an X Article?)`)
      process.exit(1)
    }

    console.log(`\n✓ Found article: "${article.title}"`)
    console.log(`  Author: @${article.author_handle}`)
    console.log(`  Views: ${article.metrics?.views || 0}`)
    console.log(`  Likes: ${article.metrics?.likes || 0}`)

    const result = await batchUpsertArticles([article])

    console.log('\n========================================')
    console.log('Results:')
    console.log(`  Inserted: ${result.inserted}`)
    console.log(`  Updated:  ${result.updated}`)
    console.log(`  Skipped:  ${result.skipped}`)
    console.log('========================================')
  } catch (error) {
    console.error(`Error fetching ${tweetId}:`, error)
    process.exit(1)
  }
}

main().catch(console.error)
