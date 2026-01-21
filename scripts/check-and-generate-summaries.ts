#!/usr/bin/env tsx
/**
 * Check and generate AI summaries for articles without summaries
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

async function checkAndGenerateSummaries() {
  // Check recent articles
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, summary_english, summary_chinese, summary_zh, summary_en, created_at')
    .order('created_at', { ascending: false })
    .limit(25)

  const withoutSummary = recentArticles?.filter(a => !a.summary_en && !a.summary_english && !a.summary_zh && !a.summary_chinese) || []
  const withSummary = recentArticles?.filter(a => a.summary_en || a.summary_english || a.summary_zh || a.summary_chinese) || []

  console.log('=== 检查最近25篇文章 ===')
  console.log(`有摘要: ${withSummary.length}`)
  console.log(`无摘要: ${withoutSummary.length}`)

  if (withoutSummary.length > 0) {
    console.log('\n没有摘要的文章:')
    withoutSummary.forEach(a => {
      console.log(`- ${a.title}`)
    })
  }

  // Ask if user wants to generate summaries
  if (withoutSummary.length > 0) {
    console.log('\n=== 开始生成摘要 ===\n')

    let processed = 0
    let skipped = 0

    // Fetch full content for articles without summaries
    const { data: articlesToProcess } = await supabase
      .from('articles')
      .select('id, title, full_article_content')
      .in('id', withoutSummary.map(a => a.id))

    if (!articlesToProcess) return

    for (const article of articlesToProcess) {
      const content = article.full_article_content || article.title
      const wordCount = countWords(content)
      const requirement = getSummaryRequirement(wordCount)

      console.log(`[${processed + skipped + 1}/${articlesToProcess.length}] ${article.title.slice(0, 50)}...`)
      console.log(`    词数: ${wordCount}`)

      if (requirement.shouldSkip) {
        console.log(`    ⏭ 跳过（内容太短）\n`)
        skipped++
        continue
      }

      try {
        const needsTitleTranslation = !isEnglish(article.title)

        console.log(`    📝 生成摘要中...`)
        const englishResult = await generateEnglishAnalysis(content, article.title, needsTitleTranslation)
        const summaryChinese = await translateToChinese(englishResult.summary_english)

        await supabase
          .from('articles')
          .update({
            summary_english: englishResult.summary_english,
            summary_chinese: summaryChinese,
            summary_zh: summaryChinese, // Also populate summary_zh
            summary_en: englishResult.summary_english, // Also populate summary_en
            title_english: needsTitleTranslation ? englishResult.title_english : article.title,
            language: needsTitleTranslation ? 'zh' : 'en',
            summary_generated_at: new Date().toISOString()
          })
          .eq('id', article.id)

        console.log(`    ✓ 完成\n`)
        processed++

        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`    ✗ 错误: ${error instanceof Error ? error.message : String(error)}\n`)
      }
    }

    console.log('=== 汇总 ===')
    console.log(`已处理: ${processed}`)
    console.log(`已跳过: ${skipped}`)
  }
}

checkAndGenerateSummaries().catch(console.error)
