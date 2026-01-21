#!/usr/bin/env tsx
/**
 * Fetch specific tweets by URL and add them as articles
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

// Extract tweet ID from X.com URL
function extractTweetId(url: string): string | null {
  const patterns = [
    /x\.com\/[^\/]+\/status\/(\d+)/,
    /twitter\.com\/[^\/]+\/status\/(\d+)/,
    /x\.com\/i\/web\/status\/(\d+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Tweet URLs to fetch
const TWEET_URLS = [
  'https://x.com/mandrusko1/status/2012197075472052473',
  'https://x.com/creation247/status/2012598176138535041',
  'https://x.com/damianplayer/status/2013338667964604909',
  'https://x.com/think_hacking/status/2013219786260701287',
  'https://x.com/PaoRangThong/status/2012902419794174202',
  'https://x.com/elonhatesder4/status/2013245582916133159',
  'https://x.com/DefiyantlyFree/status/2012345557553996061',
  'https://x.com/venturetwins/status/2012583915215880584',
  'https://x.com/gregisenberg/status/2012316514922201347',
  'https://x.com/OmarExplains/article/2013213200934723977',
  'https://x.com/affaanmustafa/status/2012378465664745795',
  'https://x.com/Pxstar_/status/2012728374725398570',
  'https://x.com/hantengri/status/2012710088679489887',
  'https://x.com/LoneStarChica/status/2012958683781542010',
  'https://x.com/Mrbankstips/status/2012768822353121684',
  'https://x.com/bluewmist/status/2012755834636533893',
  'https://x.com/thedankoe/status/2012956603297964167',
  'https://x.com/XCreators/status/2011957172821737574',
  'https://x.com/mralexthomas/status/2012900090420040160',
  'https://x.com/poptime/status/2013310977467429118',
  'https://x.com/ryanhallyall/status/2013329612994998484',
  'https://x.com/RonKarlsbergMD/status/2012607331373088859',
  'https://x.com/beaverd/status/2013366996180574446',
  'https://x.com/KobeissiLetter/status/2012608685462220879',
]

async function main() {
  const client = createTwitterClient()
  const allArticles: NonNullable<ReturnType<typeof mapTweetToArticle>>[] = []

  console.log('=== Fetching Specific Tweets ===\n')

  for (const url of TWEET_URLS) {
    const tweetId = extractTweetId(url)

    if (!tweetId) {
      console.log(`✗ Could not extract ID from: ${url}`)
      continue
    }

    console.log(`Fetching ${tweetId}...`)

    try {
      const tweet = await client.fetchTweet(tweetId)

      if (!tweet) {
        console.log(`  ✗ Tweet not found or error`)
        continue
      }

      const article = mapTweetToArticle(tweet)

      if (article) {
        allArticles.push(article)
        const wordCount = article.full_article_content?.split(/\s+/).length || 0
        console.log(`  ✓ ${article.title.slice(0, 50)}... (${wordCount} words)`)
      } else {
        console.log(`  - No article content found in tweet`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`  ✗ Error:`, error instanceof Error ? error.message : String(error))
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total articles found: ${allArticles.length}`)

  if (allArticles.length > 0) {
    console.log('\n=== Saving articles to database ===')
    const result = await batchUpsertArticles(allArticles)
    console.log(`Result: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`)

    // Check for long articles
    const longArticles = allArticles.filter(a => {
      const words = a.full_article_content?.split(/\s+/).length || 0
      return words >= 100
    })
    console.log(`\nArticles with 100+ words: ${longArticles.length}`)

    // Show all article titles
    console.log('\n=== Articles ===')
    allArticles.forEach((a, i) => {
      const words = a.full_article_content?.split(/\s+/).length || 0
      console.log(`${i + 1}. ${a.title} (${words} words)`)
    })
  } else {
    console.log('\nNo articles to save.')
  }
}

main().catch(console.error)
