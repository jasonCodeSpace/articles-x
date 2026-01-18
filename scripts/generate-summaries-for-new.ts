#!/usr/bin/env tsx
/**
 * Generate AI summaries for articles without summaries
 */

import { createClient } from '@supabase/supabase-js'
import { generateEnglishAnalysis, translateToChinese } from '@/lib/deepseek'
import { isEnglish } from '@/lib/url-utils'
import { countWords, getSummaryRequirement } from '@/lib/word-count'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function generateSummaries() {
  console.log('=== Generating AI Summaries for New Articles ===\n')

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, full_article_content')
    .is('summary_chinese', null)
    .order('article_published_at', { ascending: false })
    .limit(50)

  if (!articles || articles.length === 0) {
    console.log('No articles without summaries found.')
    return
  }

  console.log(`Found ${articles.length} articles without summaries\n`)

  let processed = 0
  let skipped = 0

  for (const article of articles) {
    const content = article.full_article_content || article.title
    const wordCount = countWords(content)
    const requirement = getSummaryRequirement(wordCount)

    console.log(`[${processed + skipped + 1}/${articles.length}] ${article.title.slice(0, 50)}...`)
    console.log(`    Words: ${wordCount}`)

    if (requirement.shouldSkip) {
      console.log(`    ⏭ Skipped\n`)
      skipped++
      continue
    }

    try {
      const needsTitleTranslation = !isEnglish(article.title)

      console.log(`    📝 Generating summary...`)
      const englishResult = await generateEnglishAnalysis(content, article.title, needsTitleTranslation)
      const summaryChinese = await translateToChinese(englishResult.summary_english)

      await supabase
        .from('articles')
        .update({
          summary_english: englishResult.summary_english,
          summary_chinese: summaryChinese,
          title_english: needsTitleTranslation ? englishResult.title_english : article.title,
          language: needsTitleTranslation ? 'zh' : 'en',
          summary_generated_at: new Date().toISOString()
        })
        .eq('id', article.id)

      console.log(`    ✓ Done\n`)
      processed++

      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`    ✗ Error: ${error instanceof Error ? error.message : String(error)}\n`)
    }
  }

  console.log('=== Summary ===')
  console.log(`Processed: ${processed}`)
  console.log(`Skipped: ${skipped}`)
}

generateSummaries().catch(console.error)
