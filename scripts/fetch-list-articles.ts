#!/usr/bin/env tsx
/**
 * Fetch articles from Twitter lists (deep crawl with full content)
 *
 * This script:
 * 1. Fetches tweets from lists
 * 2. Finds potential articles (tweets with article_results)
 * 3. Deep fetches each to get full content
 * 4. Saves to database
 */

import { createClient } from '@supabase/supabase-js'
import { createTwitterClient } from '@/lib/services/twitter/client'
import { mapTweetToArticle } from '@/lib/services/article/mapper'
import { batchUpsertArticles } from '@/lib/services/article'
import type { TwitterTweet } from '@/lib/services/twitter/types'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIST_IDS = [
  '1961293346099589584',
  '1961296267004502233',
  '1961298657371910342'
]

// Check if tweet has article data
function isPotentialArticle(tweet: TwitterTweet): boolean {
  return !!(
    tweet.article_results?.result ||
    tweet.article?.article_results?.result
  )
}

async function fetchArticlesFromLists(maxPagesPerList = 15) {
  const client = createTwitterClient()
  const allArticles: NonNullable<ReturnType<typeof mapTweetToArticle>>[] = []

  console.log('=== Fetching Articles from Twitter Lists ===\n')

  for (const listId of LIST_IDS) {
    console.log(`Fetching list ${listId}...`)

    // Get all tweets from list
    const tweets = await client.fetchAllListPages(listId, maxPagesPerList)
    console.log(`  Found ${tweets.length} tweets`)

    // Filter potential articles
    const potentialArticles = tweets.filter(isPotentialArticle)
    console.log(`  Found ${potentialArticles.length} potential articles`)

    let deepFetchCount = 0
    let articleCount = 0

    // Deep fetch each potential article
    for (const tweet of potentialArticles) {
      const tweetId = tweet.legacy?.id_str || tweet.rest_id

      if (!tweetId) continue

      try {
        // Deep fetch to get full content
        const fullTweet = await client.fetchTweet(tweetId)

        if (fullTweet) {
          const article = mapTweetToArticle(fullTweet)
          if (article) {
            allArticles.push(article)
            articleCount++
            const wordCount = article.full_article_content?.split(/\s+/).length || 0
            console.log(`  ✓ [${articleCount}] ${article.title.slice(0, 40)}... (${wordCount} words)`)
          }
        }

        deepFetchCount++
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`  ✗ Error fetching tweet ${tweetId}:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log(`  List complete: ${articleCount} articles (deep fetched ${deepFetchCount})\n`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return allArticles
}

async function main() {
  const allArticles = await fetchArticlesFromLists(15)

  console.log(`\n=== Summary ===`)
  console.log(`Total articles found: ${allArticles.length}`)

  if (allArticles.length > 0) {
    console.log('\n=== Saving articles to database ===')
    const result = await batchUpsertArticles(allArticles)
    console.log(`Result: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`)

    // Count articles with substantial content
    const longArticles = allArticles.filter(a => {
      const words = a.full_article_content?.split(/\s+/).length || 0
      return words >= 100
    })
    console.log(`\nArticles with 100+ words: ${longArticles.length}`)
  } else {
    console.log('\nNo articles to save.')
  }
}

main().catch(console.error)
