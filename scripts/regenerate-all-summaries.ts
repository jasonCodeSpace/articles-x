#!/usr/bin/env tsx
/**
 * Regenerate all article summaries using the new Reading Guide prompt
 */

import { createClient } from '@supabase/supabase-js'
import { generateReadingGuide } from '@/lib/deepseek'
import { translateToChinese } from '@/lib/deepseek'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function regenerateAllSummaries() {
  console.log('=== Regenerating All Summaries with New Reading Guide Prompt ===\n')

  // Get all articles that have content
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, full_article_content')
    .not('full_article_content', 'is', null)
    .order('article_published_at', { ascending: false })
    .limit(500)

  if (!articles || articles.length === 0) {
    console.log('No articles found')
    return
  }

  console.log(`Found ${articles.length} articles to regenerate summaries\n`)

  let processed = 0
  let skipped = 0
  let failed = 0

  for (const article of articles) {
    const wordCount = article.full_article_content.split(/\s+/).length

    // Skip very short articles
    if (wordCount < 100) {
      skipped++
      continue
    }

    try {
      console.log(`[${processed + skipped + failed + 1}/${articles.length}] ${article.title.slice(0, 50)}... (${wordCount} words)`)

      // Generate new reading guide
      const guide = await generateReadingGuide(article.full_article_content, article.title)

      // Translate to Chinese
      console.log(`    🇨🇳 Translating to Chinese...`)
      const summaryChinese = await translateToChinese(guide.summary_english)

      // Update database
      const { error } = await supabase
        .from('articles')
        .update({
          summary_english: guide.summary_english,
          summary_chinese: summaryChinese,
          summary_generated_at: new Date().toISOString()
        })
        .eq('id', article.id)

      if (error) {
        console.error(`    ✗ Error updating database: ${error.message}`)
        failed++
      } else {
        console.log(`    ✓ Done`)
        processed++
      }

      // Delay between articles (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`    ✗ Error: ${error instanceof Error ? error.message : String(error)}`)
      failed++
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Processed: ${processed}`)
  console.log(`Skipped: ${skipped} (too short)`)
  console.log(`Failed: ${failed}`)
}

regenerateAllSummaries().catch(console.error)
