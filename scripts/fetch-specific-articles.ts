#!/usr/bin/env npx tsx
/**
 * Fetch specific articles from X URLs and save to database
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createTwitterClient } from '../lib/services/twitter'
import { mapTweetToArticle, batchUpsertArticles } from '../lib/services/article'

// URLs to fetch
const URLS = [
  'https://x.com/dontbesilent12/article/2017963276131598428',
  'https://x.com/0xkakarot888/status/2016657648658403407',
  'https://x.com/oxbaboon/status/2017603416898596957',
  'https://x.com/NewRightPoast/status/1942626551884841109',
  'https://x.com/CoooolXyh/status/2017953638145237143',
  'https://x.com/hellocryptoLeon/status/2017113384681160822',
  'https://x.com/attentionvc/status/2017557944892797438',
]

// Extract tweet ID from URL
function extractTweetId(url: string): string {
  const match = url.match(/(\d{15,})/)
  return match ? match[1] : ''
}

async function main() {
  const client = createTwitterClient()
  const articles: any[] = []

  console.log('========================================')
  console.log('Fetching specific articles from X')
  console.log('========================================')

  for (const url of URLS) {
    const tweetId = extractTweetId(url)
    if (!tweetId) {
      console.warn(`Could not extract tweet ID from: ${url}`)
      continue
    }

    console.log(`\nFetching tweet ${tweetId}...`)

    try {
      const tweet = await client.fetchTweet(tweetId)
      if (!tweet) {
        console.warn(`  No data returned for tweet ${tweetId}`)
        continue
      }

      const article = mapTweetToArticle(tweet)
      if (article) {
        console.log(`  ✓ Found article: "${article.title.slice(0, 50)}..."`)
        articles.push(article)
      } else {
        console.warn(`  Could not map tweet to article (not an X Article?)`)
      }

      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`  Error fetching ${tweetId}:`, error)
    }
  }

  console.log('\n========================================')
  console.log(`Fetched ${articles.length} articles`)
  console.log('========================================')

  if (articles.length > 0) {
    console.log('\nSaving to database...')
    const result = await batchUpsertArticles(articles)

    console.log('========================================')
    console.log('Results:')
    console.log(`  Inserted: ${result.inserted}`)
    console.log(`  Updated:  ${result.updated}`)
    console.log(`  Skipped:  ${result.skipped}`)
    console.log('========================================')
  }
}

main().catch(console.error)
