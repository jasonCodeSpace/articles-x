#!/usr/bin/env npx tsx
/**
 * Initialize article scores and indexed status
 * Adds score/indexed columns and calculates scores for existing articles
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { calculateArticleScore, meetsMinimumWordCount, shouldIndexArticle } from '../lib/article-score'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function initScores() {
  console.log('========================================')
  console.log('Initializing Article Scores')
  console.log('========================================')

  // First, add columns if they don't exist
  console.log('\n1. Adding columns...')
  try {
    // Try to add the columns (will fail if they exist, that's ok)
    await supabase.rpc('exec', {
      sql: `ALTER TABLE articles
             ADD COLUMN IF NOT EXISTS indexed BOOLEAN NOT NULL DEFAULT FALSE,
             ADD COLUMN IF NOT EXISTS score NUMERIC NOT NULL DEFAULT 0;
             CREATE INDEX IF NOT EXISTS articles_indexed_idx ON articles (indexed);
             CREATE INDEX IF NOT EXISTS articles_score_idx ON articles (score DESC);
             CREATE INDEX IF NOT EXISTS articles_indexed_score_idx ON articles (indexed, score DESC);`
    })
    console.log('   Columns added/verified')
  } catch (error: any) {
    console.log('   Columns may already exist:', error.message)
  }

  // Get all articles without scores
  console.log('\n2. Fetching articles...')
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, tweet_views, tweet_likes, tweet_replies, full_article_content')

  if (error) {
    console.error('   Error:', error)
    process.exit(1)
  }

  console.log(`   Found ${articles?.length || 0} articles`)

  // Calculate scores
  console.log('\n3. Calculating scores...')
  let updated = 0
  let skipped = 0

  for (const article of articles || []) {
    const wordCount = article.full_article_content?.length || 0

    // Skip if too short
    if (!meetsMinimumWordCount(article.full_article_content || '')) {
      skipped++
      continue
    }

    const score = calculateArticleScore({
      tweet_views: article.tweet_views,
      tweet_likes: article.tweet_likes,
      tweet_replies: article.tweet_replies,
      full_article_content: article.full_article_content
    })

    const indexed = shouldIndexArticle(score)

    const { error: updateError } = await supabase
      .from('articles')
      .update({ score, indexed })
      .eq('id', article.id)

    if (!updateError) {
      updated++
      if (updated <= 10) {
        console.log(`   [${score}] ${article.title.substring(0, 50)}...`)
      }
    }
  }

  console.log(`\n4. Results:`)
  console.log(`   Updated: ${updated} articles`)
  console.log(`   Skipped (too short): ${skipped} articles`)

  // Get stats
  const { count: indexedCount, error: statsError } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('indexed', true)

  console.log(`   Total indexed: ${indexedCount}`)

  console.log('\n========================================')
  console.log('Initialization Complete!')
  console.log('========================================')
}

initScores().catch(console.error)
