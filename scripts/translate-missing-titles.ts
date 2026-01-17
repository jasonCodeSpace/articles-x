/**
 * Script to translate all article titles that don't have title_english
 * Run with: npx tsx scripts/translate-missing-titles.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const deepseekApiKey = process.env.DEEPSEEK_API_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials')
}

if (!deepseekApiKey) {
  throw new Error('Missing DEEPSEEK_API_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: deepseekApiKey,
})

/**
 * Translate title to English
 */
async function translateTitle(title: string): Promise<string> {
  // Check if title is already English
  const isEnglishText = /^[a-zA-Z0-9\s\-\.\,\:\;\!\?\(\)\[\]\{\}'"]+$/.test(title.trim())
  if (isEnglishText) {
    return title.trim()
  }

  const prompt = `Translate this title to English. Output ONLY the English title, nothing else:

${title}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    })

    return completion.choices[0]?.message?.content?.trim() || title
  } catch (error) {
    console.error('Error translating title:', error)
    return title
  }
}

/**
 * Batch translate titles with delay to avoid rate limits
 */
async function batchTranslate(
  articles: Array<{ id: string; title: string }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  let processed = 0

  for (const article of articles) {
    try {
      console.log(`[${processed + 1}/${articles.length}] Translating: ${article.title.substring(0, 50)}...`)
      const translated = await translateTitle(article.title)
      results.set(article.id, translated)
      console.log(`  -> ${translated}`)

      // Delay to avoid rate limits (1 second per request)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`  -> Error: ${error}`)
      results.set(article.id, article.title) // Fallback to original title
    }

    processed++
  }

  return results
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching articles without title_english...')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, title_english')
    .is('title_english', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
    process.exit(1)
  }

  if (!articles || articles.length === 0) {
    console.log('No articles missing title_english found!')
    process.exit(0)
  }

  console.log(`Found ${articles.length} articles without title_english`)
  console.log('Starting translation...')

  const translations = await batchTranslate(articles)

  console.log('\nUpdating database...')

  let updated = 0
  let failed = 0

  for (const [id, titleEnglish] of translations.entries()) {
    const { error } = await supabase
      .from('articles')
      .update({ title_english: titleEnglish })
      .eq('id', id)

    if (error) {
      console.error(`Failed to update article ${id}:`, error)
      failed++
    } else {
      updated++
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`)
}

main().catch(console.error)
