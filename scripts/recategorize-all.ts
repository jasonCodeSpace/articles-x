/**
 * Recategorize all articles using DeepSeek AI
 * Run with: npx tsx scripts/recategorize-all.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { categorizeWithDeepSeek } from '../lib/services/deepseek-categorizer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Supabase environment variables not set')
}

const supabase = createClient(supabaseUrl, serviceKey)

/**
 * Fetch all indexed articles
 */
async function fetchAllArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, title_english, category, summary_english, summary_chinese')
    .eq('indexed', true)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`)
  }

  return data || []
}

/**
 * Update article with new categories
 */
async function updateArticleCategories(
  articleId: string,
  categoryAssignment: ReturnType<typeof categorizeWithDeepSeek> extends Promise<infer T> ? T : never
) {
  // Update main category fields
  const { error: updateError } = await supabase
    .from('articles')
    .update({
      category: categoryAssignment.primary.category_combined,
      main_category: categoryAssignment.primary.main_category,
      sub_category: categoryAssignment.primary.sub_category,
      updated_at: new Date().toISOString()
    })
    .eq('id', articleId)

  if (updateError) {
    throw new Error(`Failed to update article: ${updateError.message}`)
  }

  // Clear old categories and insert new ones
  await supabase.from('article_categories').delete().eq('article_id', articleId)

  const categoryInserts = categoryAssignment.categories.map((cat, index) => ({
    article_id: articleId,
    category: cat,
    is_primary: index === 0
  }))

  const { error: junctionError } = await supabase
    .from('article_categories')
    .insert(categoryInserts)

  if (junctionError) {
    console.warn(`  ⚠️  Failed to save junction categories: ${junctionError.message}`)
  }
}

/**
 * Main recategorization function
 */
async function recategorizeAll() {
  console.log('📋 Fetching all articles...')
  const articles = await fetchAllArticles()
  console.log(`✓ Found ${articles.length} articles`)

  let processed = 0
  let failed = 0
  const startTime = Date.now()

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const prefix = `[${i + 1}/${articles.length}]`

    try {
      console.log(`${prefix} Processing: ${article.title.substring(0, 50)}...`)

      const categoryAssignment = await categorizeWithDeepSeek(
        article.title,
        article.title_english,
        article.summary_english,
        article.summary_chinese
      )

      await updateArticleCategories(article.id, categoryAssignment as any)

      const oldCategory = article.category || 'none'
      const newCategory = categoryAssignment.primary.category_combined
      const changed = oldCategory !== newCategory ? ' (changed!)' : ''

      console.log(
        `  ✓ ${newCategory}${changed}\n` +
        `    Categories: ${categoryAssignment.categories.join(', ')}\n` +
        `    Reasoning: ${categoryAssignment.reasoning || 'N/A'}`
      )

      processed++
    } catch (error) {
      console.error(`  ✗ Error: ${error}`)
      failed++
    }

    // Rate limiting: wait between requests
    if (i < articles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(50))
  console.log('Recategorization complete!')
  console.log(`✓ Processed: ${processed}`)
  console.log(`✗ Failed: ${failed}`)
  console.log(`⏱️  Time: ${elapsed}s`)
  console.log('='.repeat(50))
}

// Run
recategorizeAll().catch(console.error)
