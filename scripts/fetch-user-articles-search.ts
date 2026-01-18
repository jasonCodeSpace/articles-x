#!/usr/bin/env tsx
/**
 * Fetch articles from a specific user using search approach
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

interface SearchTimelineResponse {
  result?: {
    timeline?: {
      instructions?: Array<{
        entries?: Array<{
          entryId?: string
          content?: {
            entryType?: string
            itemContent?: {
              itemType?: string
              tweet_results?: {
                result?: TwitterTweet
              }
            }
          }
        }>
      }>
    }
  }
}

async function fetchUserArticlesByUsername(username: string, maxResults = 100) {
  const client = createTwitterClient()
  const articles: NonNullable<ReturnType<typeof mapTweetToArticle>>[] = []
  const processedTweetIds = new Set<string>()

  console.log(`=== Fetching articles from @${username} ===\n`)

  // Try using search with "from:username" query
  // We'll fetch multiple pages to get more results
  let cursor: string | undefined
  let pageCount = 0
  const maxPages = 10 // Up to 200 tweets

  while (pageCount < maxPages && articles.length < maxResults) {
    try {
      // Build search query
      const searchQuery = `from:${username} lang:en OR lang:zh`

      // Use the search endpoint
      const url = `https://${process.env.RAPIDAPI_HOST}/search`
      const params = new URLSearchParams({
        q: searchQuery,
        count: '20',
        ...(cursor && { cursor })
      })

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!
        }
      })

      if (!response.ok) {
        console.error(`Search failed: ${response.status}`)
        break
      }

      const data = await response.json() as SearchTimelineResponse

      // Extract tweets from response
      const entries: any[] = data?.result?.timeline?.instructions?.[0]?.entries || []

      for (const entry of entries) {
        if (entry.content?.itemContent?.tweet_results?.result) {
          const tweet = entry.content.itemContent.tweet_results.result
          const tweetId = tweet.rest_id || tweet.legacy?.id_str

          if (tweetId && !processedTweetIds.has(tweetId)) {
            processedTweetIds.add(tweetId)

            // Check if it's an article
            if (tweet.article_results?.result || tweet.article?.article_results?.result) {
              // Deep fetch for full content
              try {
                const fullTweet = await client.fetchTweet(tweetId)
                if (fullTweet) {
                  const article = mapTweetToArticle(fullTweet)
                  if (article) {
                    articles.push(article)
                    const wordCount = article.full_article_content?.split(/\s+/).length || 0
                    console.log(`  ✓ [${articles.length}] ${article.title.slice(0, 40)}... (${wordCount} words)`)
                  }
                }
                await new Promise(resolve => setTimeout(resolve, 500))
              } catch (e) {
                // Skip if deep fetch fails
              }
            }
          }
        }
      }

      pageCount++
      console.log(`Page ${pageCount}: ${articles.length} articles found so far`)

      // Try to get next cursor
      const cursorEntry = entries.find((e: any) =>
        e.content?.entryType === 'TimelineTimelineCursor' && e.content?.cursorType === 'Bottom'
      )
      if (cursorEntry?.content?.value) {
        cursor = cursorEntry.content.value
      } else {
        break
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error on page ${pageCount + 1}:`, error)
      break
    }
  }

  return articles
}

async function main() {
  const username = 'thedankoe'

  const articles = await fetchUserArticlesByUsername(username, 200)

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
