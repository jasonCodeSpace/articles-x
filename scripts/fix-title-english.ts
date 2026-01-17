/**
 * One-time fix script: Remove Chinese characters from title_english
 *
 * Usage: npx tsx scripts/fix-title-english.ts
 *
 * This script:
 * 1. Finds all articles where title_english contains Chinese characters
 * 2. Uses DeepSeek to translate them to pure English
 * 3. Updates the slug based on the corrected English title
 *
 * Run this once to fix existing data. After this, the updated
 * generateArticleAnalysis() function will prevent this issue.
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const deepSeekKey = process.env.DEEPSEEK_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: deepSeekKey,
})

/**
 * Check if text contains Chinese characters
 */
function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text || '')
}

/**
 * Check if text is pure English (no Chinese)
 */
function isPureEnglish(text: string): boolean {
  if (!text) return false
  const hasChineseChars = /[\u4e00-\u9fff]/.test(text)
  const hasEnglishLetters = /[a-zA-Z]/.test(text)
  return hasEnglishLetters && !hasChineseChars
}

/**
 * Translate title to pure English
 */
async function translateToEnglish(title: string): Promise<string> {
  try {
    const prompt = `Translate this title to pure English. NO Chinese characters allowed. Return ONLY the English title, nothing else.

Title: ${title}

English translation:`

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    })

    let translated = completion.choices[0]?.message?.content?.trim() || title

    // Remove any quotes or extra formatting
    translated = translated.replace(/^["']|["']$/g, '').trim()

    // If result still has Chinese, return original (better than nothing)
    if (hasChinese(translated)) {
      console.warn(`  ⚠️  Translation still has Chinese, using original`)
      return title
    }

    return translated
  } catch (error) {
    console.error(`  ❌ Translation failed:`, error)
    return title
  }
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

async function main() {
  console.log('========================================')
  console.log('Fixing title_english (removing Chinese)')
  console.log('========================================\n')

  // Find all articles with Chinese in title_english
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, title_english, slug')
    .not('title_english', 'is', null)

  if (error) {
    console.error('Error fetching articles:', error)
    process.exit(1)
  }

  console.log(`Found ${articles.length} total articles`)

  // Filter articles with Chinese in title_english
  const needFix = articles.filter(a =>
    a.title_english && hasChinese(a.title_english)
  )

  console.log(`Found ${needFix.length} articles with Chinese in title_english\n`)

  if (needFix.length === 0) {
    console.log('✅ No articles need fixing!')
    return
  }

  let fixed = 0
  let failed = 0

  for (const article of needFix) {
    try {
      console.log(`[${fixed + 1}/${needFix.length}] ${article.title.substring(0, 50)}...`)
      console.log(`  Current title_english: ${article.title_english}`)

      // Skip if it's actually already pure English (false positive)
      if (isPureEnglish(article.title_english)) {
        console.log(`  ✓ Already pure English, skipping`)
        continue
      }

      // Translate to pure English
      const newTitleEnglish = await translateToEnglish(article.title_english)
      console.log(`  New title_english: ${newTitleEnglish}`)

      // Generate new slug
      const newSlug = generateSlug(newTitleEnglish)
      console.log(`  New slug: ${newSlug}`)

      // Update database
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title_english: newTitleEnglish,
          slug: newSlug,
        })
        .eq('id', article.id)

      if (updateError) {
        console.log(`  ❌ Update failed: ${updateError.message}`)
        failed++
      } else {
        console.log(`  ✅ Fixed!`)
        fixed++
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error)
      failed++
    }

    // Rate limiting - small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n========================================')
  console.log(`Done! Fixed: ${fixed}, Failed: ${failed}`)
  console.log('========================================')
}

main().catch(console.error)
