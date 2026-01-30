#!/usr/bin/env npx tsx
/**
 * Initialize article scores and indexed status v2
 * Adds score/indexed columns and calculates scores for existing articles
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { calculateArticleScore, meetsMinimumWordCount } from '../lib/article-score'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function initScores() {
  console.log('========================================')
  console.log('Initializing Article Scores v2')
  console.log('========================================')

  // Get all articles
  console.log('\n1. Fetching articles...')
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, tweet_views, tweet_likes, tweet_replies, full_article_content, score, indexed')

  if (fetchError) {
    console.error('   Error:', fetchError)
    process.exit(1)
  }

  console.log(`   Found ${articles?.length || 0} articles`)

  // Count articles without scores
  const needsScore = articles?.filter(a => a.score === null || a.score === 0) || []
  console.log(`   Articles needing score: ${needsScore.length}`)

  if (needsScore.length === 0) {
    console.log('\nAll articles already have scores!')
    const indexedCount = articles?.filter(a => a.indexed === true).length || 0
    console.log(`Total indexed: ${indexedCount}`)
    return
  }

  // Calculate and update scores
  console.log('\n2. Calculating and updating scores...')
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const article of needsScore.slice(0, 100)) { // Process in batches of 100
    const content = article.full_article_content || ''

    // Skip if too short
    if (!meetsMinimumWordCount(content)) {
      skipped++
      continue
    }

    const score = calculateArticleScore({
      tweet_views: article.tweet_views,
      tweet_likes: article.tweet_likes,
      tweet_replies: article.tweet_replies,
      full_article_content: content
    })

    // Use update instead of upsert
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        score,
        indexed: score >= 65 // 65 = threshold for indexing
      })
      .eq('id', article.id)

    if (updateError) {
      console.error(`   Failed to update ${article.id}: ${updateError.message}`)
      failed++
    } else {
      updated++
      if (updated <= 10) {
        console.log(`   [${score}] ${article.title.substring(0, 45)}...`)
      }
    }

    // Small delay to avoid overwhelming the database
    if (updated % 10 === 0) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  console.log(`\n3. Results:`)
  console.log(`   Updated: ${updated} articles`)
  console.log(`   Skipped (too short): ${skipped} articles`)
  console.log(`   Failed: ${failed} articles`)

  // Get final stats
  const { data: finalArticles, error: finalError } = await supabase
    .from('articles')
    .select('score, indexed')

  if (!finalError && finalArticles) {
    const indexedCount = finalArticles.filter(a => a.indexed === true).length
    const avgScore = finalArticles.reduce((sum, a) => sum + (a.score || 0), 0) / finalArticles.length
    console.log(`\n4. Final stats:`)
    console.log(`   Total articles: ${finalArticles.length}`)
    console.log(`   Indexed (score >= 65): ${indexedCount}`)
    console.log(`   Average score: ${avgScore.toFixed(1)}`)
  }

  console.log('\n========================================')
  console.log('Initialization Complete!')
  console.log('========================================')
}

initScores().catch(console.error)
