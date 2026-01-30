#!/usr/bin/env npx tsx
/**
 * Analyze article scores from the past week
 * Estimates how many articles would meet the score >= 60 threshold
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { calculateArticleScore, shouldIndexArticle, meetsMinimumWordCount } from '../lib/article-score'
import { countWords } from '../lib/word-count'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzePastWeek() {
  // Get articles from the past 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .gte('article_published_at', sevenDaysAgo.toISOString())
    .order('article_published_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
    process.exit(1)
  }

  if (!articles || articles.length === 0) {
    console.log('No articles found in the past 7 days')
    return
  }

  console.log(`\n========================================`)
  console.log(`Analyzing ${articles.length} articles from the past 7 days`)
  console.log(`========================================\n`)

  // Analyze each article
  const results = articles.map(article => {
    const wordCount = countWords(article.full_article_content || '')
    const meetsWordCount = meetsMinimumWordCount(article.full_article_content || '')
    const score = calculateArticleScore({
      tweet_views: article.tweet_views,
      tweet_likes: article.tweet_likes,
      tweet_replies: article.tweet_replies,
      full_article_content: article.full_article_content
    })
    const wouldIndex = shouldIndexArticle(score)

    return {
      title: article.title,
      author: article.author_handle,
      wordCount,
      score,
      wouldIndex,
      views: article.tweet_views || 0,
      likes: article.tweet_likes || 0,
      replies: article.tweet_replies || 0,
      publishedAt: article.article_published_at
    }
  })

  // Statistics
  const totalArticles = results.length
  const meetsWordCountCount = results.filter(r => r.wordCount >= 200).length
  const wouldIndexCount = results.filter(r => r.wouldIndex).length
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalArticles

  // Score distribution
  const scoreRanges = {
    '0-20': results.filter(r => r.score < 20).length,
    '20-40': results.filter(r => r.score >= 20 && r.score < 40).length,
    '40-60': results.filter(r => r.score >= 40 && r.score < 60).length,
    '60-80': results.filter(r => r.score >= 60 && r.score < 80).length,
    '80-100': results.filter(r => r.score >= 80).length,
  }

  console.log(`📊 SUMMARY`)
  console.log(`────────────────────────────────────────`)
  console.log(`Total articles (past 7 days):     ${totalArticles}`)
  console.log(`Articles with >= 200 words:       ${meetsWordCountCount} (${(meetsWordCountCount/totalArticles*100).toFixed(1)}%)`)
  console.log(`Articles that would be indexed:   ${wouldIndexCount} (${(wouldIndexCount/totalArticles*100).toFixed(1)}%)`)
  console.log(`Articles NOT indexed (score<60):  ${totalArticles - wouldIndexCount} (${((totalArticles - wouldIndexCount)/totalArticles*100).toFixed(1)}%)`)
  console.log(`Average score:                    ${avgScore.toFixed(1)}`)
  console.log(`\n📈 SCORE DISTRIBUTION`)
  console.log(`────────────────────────────────────────`)
  for (const [range, count] of Object.entries(scoreRanges)) {
    const percentage = (count / totalArticles * 100).toFixed(1)
    const bar = '█'.repeat(Math.floor(parseFloat(percentage) / 2))
    console.log(`${range.padEnd(8)} ${count.toString().padStart(3)} (${percentage.padStart(5)}%) ${bar}`)
  }

  // Daily breakdown
  console.log(`\n📅 DAILY BREAKDOWN`)
  console.log(`────────────────────────────────────────`)
  const dailyStats: Record<string, { total: number; indexed: number }> = {}

  for (const result of results) {
    const date = new Date(result.publishedAt || '').toISOString().split('T')[0]
    if (!dailyStats[date]) {
      dailyStats[date] = { total: 0, indexed: 0 }
    }
    dailyStats[date].total++
    if (result.wouldIndex) {
      dailyStats[date].indexed++
    }
  }

  for (const [date, stats] of Object.entries(dailyStats).sort()) {
    const percentage = (stats.indexed / stats.total * 100).toFixed(1)
    console.log(`${date}  ${stats.total.toString().padStart(3)} total, ${stats.indexed.toString().padStart(2)} indexed (${percentage}%)`)
  }

  // Show top scoring articles
  console.log(`\n🏆 TOP 10 ARTICLES BY SCORE`)
  console.log(`────────────────────────────────────────`)
  const topArticles = [...results].sort((a, b) => b.score - a.score).slice(0, 10)

  for (const article of topArticles) {
    console.log(`${article.score.toString().padStart(3)} | ${article.title.substring(0, 60)}...`)
    console.log(`       Words: ${article.wordCount} | Views: ${article.views.toLocaleString()} | Likes: ${article.likes} | Replies: ${article.replies}`)
  }

  // Show articles just below threshold
  console.log(`\n⚠️  NEAR THRESHOLD (50-60 score, not indexed)`)
  console.log(`────────────────────────────────────────`)
  const nearThreshold = results.filter(r => r.score >= 50 && r.score < 60).sort((a, b) => b.score - a.score)

  for (const article of nearThreshold) {
    console.log(`${article.score.toString().padStart(3)} | ${article.title.substring(0, 60)}...`)
    console.log(`       Words: ${article.wordCount} | Views: ${article.views.toLocaleString()} | Likes: ${article.likes} | Replies: ${article.replies}`)
  }

  console.log(`\n========================================`)
  console.log(`Estimated daily indexed articles:     ${(wouldIndexCount / 7).toFixed(1)}`)
  console.log(`========================================\n`)
}

analyzePastWeek().catch(console.error)
