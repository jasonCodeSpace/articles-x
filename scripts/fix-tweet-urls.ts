#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface TweetRow {
  id: number
  tweet_id: string
  author_handle: string
  article_url?: string
}

interface ArticleRow {
  id: number
  slug: string
  article_url?: string
  tweet_id?: string
}

/**
 * Convert incorrect article URLs to correct format
 * Converts https://x.com/i/articles/{rest_id} to https://x.com/{author_handle}/status/{tweet_id}
 */
function convertToCorrectArticleUrl(url: string, authorHandle: string, tweetId: string): string {
  if (!url) return url
  
  // Pattern: https://x.com/i/articles/{rest_id} -> https://x.com/{author_handle}/status/{tweet_id}
  const articlesPattern = /^https:\/\/x\.com\/i\/articles\/(\d+)$/
  if (articlesPattern.test(url)) {
    return `https://x.com/${authorHandle}/status/${tweetId}`
  }
  
  // If it's already in the correct format, return as is
  const correctPattern = /^https:\/\/x\.com\/[^\/]+\/status\/\d+$/
  if (correctPattern.test(url)) {
    return url
  }
  
  // For any other x.com URL, convert to the correct format
  return `https://x.com/${authorHandle}/status/${tweetId}`
}

async function fixTweetTableUrls() {
  console.log('🔍 Finding tweets with incorrect article URLs...')
  
  // Fetch all tweets with article URLs containing x.com/i/articles or other incorrect formats
  const { data: tweets, error: fetchError } = await supabase
    .from('tweets')
    .select('id, tweet_id, author_handle, article_url')
    .not('article_url', 'is', null)
    .order('id')
  
  if (fetchError) {
    console.error('❌ Error fetching tweets:', fetchError)
    process.exit(1)
  }
  
  if (!tweets || tweets.length === 0) {
    console.log('✅ No tweets found with article URLs')
    return { updated: 0, skipped: 0 }
  }
  
  console.log(`📊 Found ${tweets.length} tweets with article URLs`)
  
  let updated = 0
  let skipped = 0
  
  // Process tweets in batches
  const batchSize = 50
  for (let i = 0; i < tweets.length; i += batchSize) {
    const batch = tweets.slice(i, i + batchSize)
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tweets.length / batchSize)}`)
    
    for (const tweet of batch) {
      const { id, tweet_id, author_handle, article_url } = tweet
      
      if (!article_url || !tweet_id || !author_handle) {
        skipped++
        continue
      }
      
      const newUrl = convertToCorrectArticleUrl(article_url, author_handle, tweet_id)
      
      if (newUrl === article_url) {
        skipped++
        continue
      }
      
      console.log(`🔄 Updating tweet ${tweet_id}:`)
      console.log(`   From: ${article_url}`)
      console.log(`   To:   ${newUrl}`)
      
      const { error: updateError } = await supabase
        .from('tweets')
        .update({ 
          article_url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (updateError) {
        console.error(`❌ Error updating tweet ${tweet_id}:`, updateError)
        skipped++
      } else {
        updated++
      }
    }
    
    // Small delay between batches
    if (i + batchSize < tweets.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return { updated, skipped }
}

async function fixArticleTableUrls() {
  console.log('\n🔍 Skipping articles table (no tweet_id column)...')
  return { updated: 0, skipped: 0 }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting URL fix process...\n')
    
    // Fix tweets table
    const tweetStats = await fixTweetTableUrls()
    
    // Fix articles table
    const articleStats = await fixArticleTableUrls()
    
    console.log('\n📈 Final Summary:')
    console.log(`Tweets - Updated: ${tweetStats.updated}, Skipped: ${tweetStats.skipped}`)
    console.log(`Articles - Updated: ${articleStats.updated}, Skipped: ${articleStats.skipped}`)
    console.log(`Total Updated: ${tweetStats.updated + articleStats.updated}`)
    
    console.log('\n🎉 URL fix completed successfully!')
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  }
}

main()