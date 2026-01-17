#!/usr/bin/env npx tsx
/**
 * 清理数据库脚本
 * - articles: 只保留最新 1000 条
 * - tweets: 只保留最新 500 条
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const client = createClient(SUPABASE_URL, SUPABASE_KEY)

async function cleanupArticles(keepCount: number = 1000) {
  console.log(`\n🧹 Cleaning articles table (keeping ${keepCount})...`)

  // Get current count
  const { count: currentCount } = await client
    .from('articles')
    .select('*', { count: 'exact', head: true })

  console.log(`   Current count: ${currentCount}`)

  if (!currentCount || currentCount <= keepCount) {
    console.log(`   ✅ No cleanup needed`)
    return
  }

  // Get the cutoff article's date
  const { data: cutoffArticle, error: cutoffError } = await client
    .from('articles')
    .select('article_published_at')
    .order('article_published_at', { ascending: false })
    .range(keepCount - 1, keepCount - 1)
    .single()

  if (cutoffError || !cutoffArticle) {
    console.log('   ❌ Error getting cutoff:', cutoffError)
    return
  }

  console.log(`   Cutoff date: ${cutoffArticle.article_published_at}`)

  // Delete articles older than cutoff
  const { error: deleteError, count: deletedCount } = await client
    .from('articles')
    .delete({ count: 'exact' })
    .lt('article_published_at', cutoffArticle.article_published_at)

  if (deleteError) {
    console.log('   ❌ Delete error:', deleteError)
  } else {
    console.log(`   ✅ Deleted ${deletedCount} old articles`)
  }

  // Verify
  const { count: remaining } = await client
    .from('articles')
    .select('*', { count: 'exact', head: true })
  console.log(`   Remaining: ${remaining}`)
}

async function cleanupTweets(keepCount: number = 500) {
  console.log(`\n🧹 Cleaning tweets table (keeping ${keepCount})...`)

  // Get current count
  const { count: currentCount } = await client
    .from('tweets')
    .select('*', { count: 'exact', head: true })

  console.log(`   Current count: ${currentCount}`)

  if (!currentCount || currentCount <= keepCount) {
    console.log(`   ✅ No cleanup needed`)
    return
  }

  // Get the cutoff tweet's date
  const { data: cutoffTweet, error: cutoffError } = await client
    .from('tweets')
    .select('created_at')
    .order('created_at', { ascending: false })
    .range(keepCount - 1, keepCount - 1)
    .single()

  if (cutoffError || !cutoffTweet) {
    console.log('   ❌ Error getting cutoff:', cutoffError)
    return
  }

  console.log(`   Cutoff date: ${cutoffTweet.created_at}`)

  // Delete tweets older than cutoff
  const { error: deleteError, count: deletedCount } = await client
    .from('tweets')
    .delete({ count: 'exact' })
    .lt('created_at', cutoffTweet.created_at)

  if (deleteError) {
    console.log('   ❌ Delete error:', deleteError)
  } else {
    console.log(`   ✅ Deleted ${deletedCount} old tweets`)
  }

  // Verify
  const { count: remaining } = await client
    .from('tweets')
    .select('*', { count: 'exact', head: true })
  console.log(`   Remaining: ${remaining}`)
}

async function main() {
  console.log('🗄️  Database Cleanup Script')
  console.log('='.repeat(40))

  await cleanupArticles(1000)
  await cleanupTweets(500)

  console.log('\n✨ Cleanup complete!')
}

main()
