#!/usr/bin/env npx tsx
/**
 * Categorize articles using AI based on title
 * 2-level category system: 5 main categories with 23 sub-categories
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { CATEGORIES, ALL_SUBCATEGORIES, getMainCategory } from '../lib/categories'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

// Format categories for AI prompt
const SUBCATEGORY_LIST = ALL_SUBCATEGORIES.map(s => s.name).join(', ')
const CATEGORY_LIST = CATEGORIES.map(c => `${c.name}: ${c.subcategories.map(s => s.name).join(', ')}`).join('\n')

/**
 * Use AI to categorize an article based on its title
 * Returns subcategory name
 */
async function categorizeTitle(title: string): Promise<{ subcategory: string; mainCategory: string }> {
  try {
    const prompt = `Categorize this article title into ONE of these subcategories:

${CATEGORY_LIST}

Title: "${title}"

Respond with ONLY the subcategory name, nothing else.`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 20
      })
    })

    if (!response.ok) {
      console.error('AI API error:', await response.text())
      return { subcategory: 'Tech', mainCategory: 'Technology' }
    }

    const data = await response.json()
    const aiResult = data.choices?.[0]?.message?.content?.trim() || 'Tech'

    // Validate and find the subcategory
    const subcat = ALL_SUBCATEGORIES.find(s =>
      s.name.toLowerCase() === aiResult.toLowerCase()
    )

    if (subcat) {
      const mainCat = CATEGORIES.find(c => c.id === subcat.mainCategory)
      return {
        subcategory: subcat.name,
        mainCategory: mainCat?.name || 'Technology'
      }
    }

    // Default fallback
    return { subcategory: 'AI', mainCategory: 'Technology' }
  } catch (error) {
    console.error('Error categorizing:', error)
    return { subcategory: 'Tech', mainCategory: 'Technology' }
  }
}

async function categorizeArticles() {
  console.log('========================================')
  console.log('Article Categorization with AI')
  console.log('========================================')
  console.log(`Categories: ${CATEGORIES.length} main, ${ALL_SUBCATEGORIES.length} subcategories`)

  // First, ensure category columns exist
  console.log('\n1. Ensuring category columns exist...')
  try {
    await supabase.rpc('exec', {
      sql: `ALTER TABLE articles
             ADD COLUMN IF NOT EXISTS category TEXT,
             ADD COLUMN IF NOT EXISTS main_category TEXT;
             CREATE INDEX IF NOT EXISTS articles_category_idx ON articles (category);
             CREATE INDEX IF NOT EXISTS articles_main_category_idx ON articles (main_category);`
    })
    console.log('   Columns verified')
  } catch (error: any) {
    console.log('   Columns may already exist:', error.message)
  }

  // Get articles without categories
  console.log('\n2. Fetching articles without categories...')
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, category')
    .or('category.is.null,category.eq.')
    .limit(500)

  if (error) {
    console.error('   Error:', error)
    process.exit(1)
  }

  console.log(`   Found ${articles?.length || 0} articles to categorize`)

  if (!articles || articles.length === 0) {
    console.log('\nNo articles to categorize!')
    return
  }

  // Categorize each article
  console.log('\n3. Categorizing articles...')
  let categorized = 0
  const categoryCounts: Record<string, number> = {}
  const mainCategoryCounts: Record<string, number> = {}

  for (const article of articles) {
    const { subcategory, mainCategory } = await categorizeTitle(article.title)

    const { error: updateError } = await supabase
      .from('articles')
      .update({ category: subcategory, main_category: mainCategory })
      .eq('id', article.id)

    if (!updateError) {
      categorized++
      categoryCounts[subcategory] = (categoryCounts[subcategory] || 0) + 1
      mainCategoryCounts[mainCategory] = (mainCategoryCounts[mainCategory] || 0) + 1

      if (categorized <= 20) {
        console.log(`   [${mainCategory}/${subcategory}] ${article.title.substring(0, 50)}...`)
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n4. Results:')
  console.log(`   Categorized: ${categorized} articles`)

  // Show main category distribution
  console.log('\n5. Main Category Distribution:')
  const sortedMain = Object.entries(mainCategoryCounts).sort((a, b) => b[1] - a[1])
  for (const [category, count] of sortedMain) {
    const maxCount = Math.max(...Object.values(mainCategoryCounts))
    const bar = '█'.repeat(Math.floor(count / maxCount * 20))
    console.log(`   ${category.padEnd(15)} ${count.toString().padStart(3)} ${bar}`)
  }

  // Show subcategory distribution
  console.log('\n6. Subcategory Distribution (top 10):')
  const sortedSub = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  for (const [category, count] of sortedSub) {
    const maxCount = Math.max(...Object.values(categoryCounts))
    const bar = '█'.repeat(Math.floor(count / maxCount * 20))
    console.log(`   ${category.padEnd(15)} ${count.toString().padStart(3)} ${bar}`)
  }

  // Get overall stats
  const { data: allArticles } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)

  const totalCount = allArticles?.length || 0
  console.log(`\n   Total categorized in database: ${totalCount}`)

  console.log('\n========================================')
  console.log('Categorization Complete!')
  console.log('========================================')
}

categorizeArticles().catch(console.error)
