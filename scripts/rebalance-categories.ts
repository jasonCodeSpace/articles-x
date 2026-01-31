#!/usr/bin/env tsx
/**
 * Re-balance article categories
 * 1. Check current distribution
 * 2. Re-categorize articles from over-represented categories to fill empty ones
 * 3. Use keyword matching to find articles that should belong to empty categories
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// All 23 subcategories with their keywords
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'tech:ai': [/\bai\b/i, /machine learning/i, /llm/i, /gpt/i, /openai/i, /anthropic/i, /claude/i, /chatgpt/i, /neural/i, /deep learning/i, /transformer/i, /tensorflow/i, /pytorch/i],
  'tech:crypto': [/crypto/i, /bitcoin/i, /ethereum/i, /blockchain/i, /defi/i, /web3/i, /nft/i, /token/i, /\bcoin\b/i, /solana/i],
  'tech:data': [/python/i, /javascript/i, /typescript/i, /code/i, /programming/i, /developer/i, /coding/i, /data science/i, /analytics/i, /sql/i, /database/i],
  'tech:security': [/security/i, /hack/i, /privacy/i, /cyber/i, /encryption/i, /vulnerability/i, /breach/i, /malware/i, /phishing/i, /2fa/i],
  'tech:hardware': [/chip/i, /semiconductor/i, /hardware/i, /\bgpu\b/i, /\bcpu\b/i, /nvidia/i, /amd/i, /intel/i, /macbook/i, /iphone/i],
  'business:startups': [/startup/i, /founder/i, /entrepreneur/i, /\byc\b/i, /venture capital/i, /\bvc\b/i, /pitch/i, /bootstrapping/i, /seed round/i, /series a/i],
  'business:markets': [/market/i, /stock/i, /trading/i, /investing/i, /economy/i, /inflation/i, /recession/i, /fed/i, /dividend/i, /s&p 500/i],
  'business:marketing': [/marketing/i, /promotion/i, /seo/i, /social media/i, /growth/i, /\bad\b/i, /funnel/i, /conversion/i, /brand/i],
  'product:product': [/product management/i, /\bpm\b/i, /ux research/i, /product strategy/i, /roadmap/i, /\bkpi\b/i, /metrics/i, /product manager/i],
  'product:design': [/design/i, /\bui\b.*\bux\b/i, /ux design/i, /figma/i, /design system/i, /typography/i, /branding/i, /user interface/i, /user experience/i],
  'product:gaming': [/gaming/i, /game/i, /esports/i, /playstation/i, /xbox/i, /nintendo/i, /steam/i, /valorant/i, /minecraft/i],
  'science:science': [/research/i, /study/i, /physics/i, /chemistry/i, /biology/i, /scientific/i, /paper/i, /journal/i, /experiment/i, /lab/i],
  'science:health': [/health/i, /medical/i, /medicine/i, /wellness/i, /mental health/i, /doctor/i, /hospital/i, /fitness/i, /covid/i, /vaccine/i],
  'science:education': [/education/i, /learning/i, /school/i, /university/i, /course/i, /tutorial/i, /student/i, /teacher/i, /curriculum/i],
  'science:environment': [/climate/i, /environment/i, /sustainability/i, /carbon/i, /green energy/i, /renewable/i, /solar/i, /wind/i, /pollution/i],
  'culture:media': [/journalism/i, /media/i, /news/i, /\btwitter\b/i, /\bx\b.*platform/i, /social platform/i, /content creator/i],
  'culture:culture': [/culture/i, /society/i, /trend/i, /generation/i],
  'culture:philosophy': [/philosophy/i, /ethics/i, /thinking/i, /mindset/i, /wisdom/i, /\blife\b/i, /fix your/i, /improve/i, /habit/i, /productivity/i, /success/i, /happiness/i, /meaning/i, /purpose/i, /goal/i, /motivation/i, /self.?improvement/i],
  'culture:history': [/history/i, /historical/i, /past/i, /lesson/i, /ancient/i],
  'culture:policy': [/policy/i, /politics/i, /government/i, /regulation/i, /law/i, /election/i, /vote/i, /democracy/i],
  'culture:personal-story': [/my story/i, /personal/i, / memoir/i, /autobiography/i, /i learned/i, /my journey/i]
}

// Empty categories that need articles
const EMPTY_CATEGORIES = [
  'tech:security',
  'tech:hardware',
  'business:marketing',
  'product:design',
  'product:gaming',
  'science:science',
  'science:health',
  'science:environment',
  'culture:history'
]

interface Article {
  id: string
  title: string
  title_english: string | null
  category: string
  slug: string
  summary_english?: string | null
  summary_chinese?: string | null
}

async function checkDistribution() {
  const { data: articles } = await supabase
    .from('articles')
    .select('category')
    .eq('indexed', true)

  const categoryCounts: Record<string, number> = {}

  for (const article of articles || []) {
    if (article.category) {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1
    }
  }

  console.log('=== Category Distribution ===')
  Object.keys(CATEGORY_PATTERNS).forEach(cat => {
    const count = categoryCounts[cat] || 0
    const status = count === 0 ? '❌ EMPTY' : count < 5 ? '⚠️ LOW' : '✅'
    console.log(`${status} ${cat}: ${count}`)
  })

  return categoryCounts
}

function findMatchingCategories(
  title: string,
  titleEnglish: string | null,
  summaryEnglish?: string | null,
  summaryChinese?: string | null
): string[] {
  const titleToUse = titleEnglish || title

  // Combine title and summaries for better matching
  // AI summary gives more accurate content understanding
  const searchContent = [
    titleToUse,
    summaryEnglish || '',
    summaryChinese || ''
  ].join(' ').toLowerCase()

  const matches: Array<{category: string, score: number, titleMatch: boolean}> = []

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    let matchCount = 0
    let hasTitleMatch = false

    for (const pattern of patterns) {
      if (pattern.test(searchContent)) {
        matchCount++
        // Check if match was specifically in title (higher weight)
        if (pattern.test(titleToUse.toLowerCase())) {
          hasTitleMatch = true
        }
      }
    }

    if (matchCount > 0) {
      // Bonus score for title matches
      const finalScore = matchCount + (hasTitleMatch ? 1 : 0)
      matches.push({ category, score: finalScore, titleMatch: hasTitleMatch })
    }
  }

  // Sort by score, prioritize title matches
  matches.sort((a, b) => {
    if (a.titleMatch && !b.titleMatch) return -1
    if (!a.titleMatch && b.titleMatch) return 1
    return b.score - a.score
  })

  return matches.map(m => m.category)
}

async function findArticlesForEmptyCategory(targetCategory: string) {
  const patterns = CATEGORY_PATTERNS[targetCategory]
  if (!patterns) return []

  // Get articles from over-represented categories (culture:culture, tech:ai, etc.)
  // Include summary_english for better classification
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, title_english, category, slug, summary_english, summary_chinese')
    .eq('indexed', true)
    .in('category', ['culture:culture', 'tech:ai', 'culture:philosophy', 'tech:data'])
    .limit(200)

  const matches: Article[] = []

  for (const article of (articles || [])) {
    // Skip if already in this category
    const currentCategories = [article.category]
    if (currentCategories.includes(targetCategory)) continue

    // Check if title or summary matches the target category
    const titleToUse = article.title_english || article.title
    const searchContent = [
      titleToUse,
      article.summary_english || '',
      article.summary_chinese || ''
    ].join(' ').toLowerCase()

    for (const pattern of patterns) {
      if (pattern.test(searchContent)) {
        matches.push(article)
        break
      }
    }
  }

  return matches
}

async function updateArticleCategories(articleId: string, newCategories: string[], primaryCategory: string) {
  // Update the main category on article
  const { error: updateError } = await supabase
    .from('articles')
    .update({
      category: primaryCategory,
      main_category: primaryCategory.split(':')[0],
      sub_category: primaryCategory.split(':')[1],
      updated_at: new Date().toISOString()
    })
    .eq('id', articleId)

  if (updateError) {
    console.error(`   ❌ Error updating article: ${updateError.message}`)
    return false
  }

  // Clear existing categories and add new ones
  await supabase
    .from('article_categories')
    .delete()
    .eq('article_id', articleId)

  const categoryInserts = newCategories.map((cat, index) => ({
    article_id: articleId,
    category: cat,
    is_primary: index === 0
  }))

  const { error: junctionError } = await supabase
    .from('article_categories')
    .insert(categoryInserts)

  if (junctionError) {
    console.error(`   ⚠️ Warning: Could not update junction table: ${junctionError.message}`)
  }

  return true
}

async function rebalanceCategories() {
  console.log('\n=== Re-balancing Categories ===\n')

  const distribution = await checkDistribution()

  for (const targetCategory of EMPTY_CATEGORIES) {
    const currentCount = distribution[targetCategory] || 0
    console.log(`\n📂 Processing ${targetCategory} (current: ${currentCount} articles)`)

    // Find articles that could belong to this category
    const potentialArticles = await findArticlesForEmptyCategory(targetCategory)

    if (potentialArticles.length === 0) {
      console.log(`   ⚠️ No matching articles found`)
      continue
    }

    console.log(`   Found ${potentialArticles.length} potential articles`)

    // Take up to 5 articles for this category
    const toUpdate = potentialArticles.slice(0, 5)

    for (const article of toUpdate) {
      // Find all matching categories for this article (using title + summary)
      const allMatches = findMatchingCategories(
        article.title,
        article.title_english,
        article.summary_english,
        article.summary_chinese
      )

      // Add the target category as primary
      const newCategories = [targetCategory, ...allMatches.filter(c => c !== targetCategory)].slice(0, 3)

      console.log(`   🔄 "${article.title_english || article.title}"`)
      console.log(`      Old: ${article.category} -> New: ${newCategories.join(', ')}`)

      const success = await updateArticleCategories(article.id, newCategories, targetCategory)

      if (success) {
        console.log(`      ✅ Updated`)
        distribution[targetCategory] = (distribution[targetCategory] || 0) + 1
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log('\n=== Final Distribution ===')
  await checkDistribution()
}

async function main() {
  try {
    await rebalanceCategories()
    console.log('\n✅ Category re-balancing completed!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
