#!/usr/bin/env npx tsx
/**
 * Categorize articles using AI based on title
 * Analyzes article titles and assigns categories
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

// Predefined categories
const CATEGORIES = [
  'Hardware', 'Gaming', 'Health', 'Environment',
  'Personal Story', 'Culture', 'Philosophy', 'History',
  'Education', 'Design', 'Marketing', 'AI',
  'Crypto', 'Tech', 'Data', 'Startups',
  'Business', 'Markets', 'Product', 'Security',
  'Policy', 'Science', 'Media'
]

/**
 * Use AI to categorize an article based on its title
 */
async function categorizeTitle(title: string): Promise<string> {
  try {
    const prompt = `Categorize this article title into ONE of these categories: ${CATEGORIES.join(', ')}

Title: "${title}"

Respond with ONLY the category name, nothing else.`

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
      return 'Tech' // Default fallback
    }

    const data = await response.json()
    const category = data.choices?.[0]?.message?.content?.trim() || 'Tech'

    // Validate category is in our list
    if (!CATEGORIES.includes(category)) {
      // Try to find a close match or default to Tech
      const upperCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
      if (CATEGORIES.includes(upperCategory)) {
        return upperCategory
      }
      return 'Tech'
    }

    return category
  } catch (error) {
    console.error('Error categorizing:', error)
    return 'Tech' // Default fallback
  }
}

async function categorizeArticles() {
  console.log('========================================')
  console.log('Article Categorization with AI')
  console.log('========================================')

  // First, ensure category column exists
  console.log('\n1. Ensuring category column exists...')
  try {
    await supabase.rpc('exec', {
      sql: `ALTER TABLE articles
             ADD COLUMN IF NOT EXISTS category TEXT;
             CREATE INDEX IF NOT EXISTS articles_category_idx ON articles (category);`
    })
    console.log('   Column verified')
  } catch (error: any) {
    console.log('   Column may already exist:', error.message)
  }

  // Get articles without categories
  console.log('\n2. Fetching articles without categories...')
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, category')
    .or('category.is.null,category.eq.')

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

  for (const article of articles) {
    const category = await categorizeTitle(article.title)

    const { error: updateError } = await supabase
      .from('articles')
      .update({ category })
      .eq('id', article.id)

    if (!updateError) {
      categorized++
      categoryCounts[category] = (categoryCounts[category] || 0) + 1

      if (categorized <= 20) {
        console.log(`   [${category}] ${article.title.substring(0, 60)}...`)
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n4. Results:')
  console.log(`   Categorized: ${categorized} articles`)

  // Show category distribution
  console.log('\n5. Category Distribution:')
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
  for (const [category, count] of sortedCategories) {
    const bar = '█'.repeat(Math.floor(count / Math.max(...Object.values(categoryCounts)) * 20))
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
