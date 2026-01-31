#!/usr/bin/env npx tsx
/**
 * 清理 AI 总结中的多余字段
 * - 移除 "Opening Hook - What makes this article worth reading?"
 * - 移除 "Opening Hook -"
 * - 移除 "Core Thesis & Framework -"
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const client = createClient(SUPABASE_URL, SUPABASE_KEY)

const patternsToRemove = [
  'Opening Hook - What makes this article worth reading?\n\n',
  'Opening Hook - ',
  'Core Thesis & Framework - ',
  '**Opening Hook** - What makes this article worth reading?\n\n',
  '**Opening Hook** - ',
  '**Core Thesis & Framework** - ',
]

function cleanSummary(summary: string | null): string | null {
  if (!summary) return null

  let cleaned = summary
  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
  }

  return cleaned
}

async function cleanSummaries() {
  console.log('🧹 Cleaning AI summaries in database...')
  console.log('='.repeat(50))

  // Fetch all articles that have summaries
  console.log('\n📥 Fetching articles with summaries...')

  let allArticles: any[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await client
      .from('articles')
      .select('id, summary_english, summary_chinese')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('❌ Error fetching articles:', error)
      break
    }

    if (!data || data.length === 0) break

    allArticles = [...allArticles, ...data]
    console.log(`   Fetched ${allArticles.length} articles...`)

    if (data.length < pageSize) break
    page++
  }

  console.log(`\n✅ Total articles fetched: ${allArticles.length}`)

  // Process articles
  const updates: { id: string, summary_english: string | null, summary_chinese: string | null }[] = []

  for (const article of allArticles) {
    const cleanedEnglish = cleanSummary(article.summary_english)
    const cleanedChinese = cleanSummary(article.summary_chinese)

    if (cleanedEnglish !== article.summary_english || cleanedChinese !== article.summary_chinese) {
      updates.push({
        id: article.id,
        summary_english: cleanedEnglish,
        summary_chinese: cleanedChinese,
      })
    }
  }

  console.log(`\n📊 Articles to update: ${updates.length}`)

  if (updates.length === 0) {
    console.log('\n✨ No articles need updating!')
    return
  }

  // Update in batches
  const batchSize = 50
  let updatedCount = 0

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)

    for (const update of batch) {
      const { error } = await client
        .from('articles')
        .update({
          summary_english: update.summary_english,
          summary_chinese: update.summary_chinese,
        })
        .eq('id', update.id)

      if (error) {
        console.error(`❌ Error updating article ${update.id}:`, error)
      } else {
        updatedCount++
      }
    }

    console.log(`   Processed ${Math.min(i + batchSize, updates.length)}/${updates.length} articles...`)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n✅ Successfully updated ${updatedCount} articles!`)
  console.log('\n✨ Cleanup complete!')
}

cleanSummaries().catch(console.error)
