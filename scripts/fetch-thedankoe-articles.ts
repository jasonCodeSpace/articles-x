#!/usr/bin/env tsx
/**
 * Fetch articles from @thedankoe using twitter-api45
 */

import { createClient } from '@supabase/supabase-js'
import { createTwitterClient } from '@/lib/services/twitter/client'
import { mapTweetToArticle } from '@/lib/services/article/mapper'
import { batchUpsertArticles } from '@/lib/services/article'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
const API_HOST = 'twitter-api45.p.rapidapi.com'

interface TimelineResponse {
  timeline: Array<{
    tweet_id: string
    text: string
    created_at: string
  }>
}

async function fetchUserTimeline(username: string, count = 100): Promise<string[]> {
  const tweetIds: string[] = []

  console.log(`Fetching timeline for @${username}...`)

  const url = `https://${API_HOST}/timeline.php`
  const params = new URLSearchParams({
    screenname: username,
    count: count.toString()
  })

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': API_HOST
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch timeline: ${response.status}`)
  }

  const data = await response.json() as TimelineResponse

  for (const tweet of data.timeline || []) {
    tweetIds.push(tweet.tweet_id)
  }

  console.log(`  Found ${tweetIds.length} tweets`)
  return tweetIds
}

async function checkAndFetchArticle(tweetId: string, client: any) {
  try {
    const tweet = await client.fetchTweet(tweetId)
    if (tweet && (tweet.article_results?.result || tweet.article?.article_results?.result)) {
      return mapTweetToArticle(tweet)
    }
  } catch (error) {
    // Skip errors
  }
  return null
}

async function main() {
  const username = 'thedankoe'
  const client = createTwitterClient()

  console.log(`=== Fetching Articles from @${username} ===\n`)

  // Fetch timeline
  const tweetIds = await fetchUserTimeline(username, 200)

  console.log(`\nChecking ${tweetIds.length} tweets for articles...`)

  const articles: any[] = []
  let checkedCount = 0

  for (const tweetId of tweetIds) {
    checkedCount++

    if (checkedCount % 20 === 0) {
      console.log(`  Checked ${checkedCount}/${tweetIds.length} tweets, found ${articles.length} articles`)
    }

    const article = await checkAndFetchArticle(tweetId, client)
    if (article) {
      articles.push(article)
      const wordCount = article.full_article_content?.split(/\s+/).length || 0
      console.log(`  ✓ [${articles.length}] ${article.title.slice(0, 50)}... (${wordCount} words)`)
    }

    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total articles found: ${articles.length}`)

  if (articles.length > 0) {
    console.log('\n=== Saving to database ===')
    const result = await batchUpsertArticles(articles)
    console.log(`Result: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`)

    const longArticles = articles.filter(a => {
      const words = a.full_article_content?.split(/\s+/).length || 0
      return words >= 100
    })
    console.log(`\nArticles with 100+ words: ${longArticles.length}`)
  }
}

main().catch(console.error)
