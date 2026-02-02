#!/usr/bin/env npx tsx
/**
 * Generate DeepSeek summaries for specific articles by tweet ID
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createServiceRoleClient } from '../lib/services/database/client'
import { generateReadingGuide, translateToChinese } from '../lib/deepseek'
import { isEnglish } from '@/lib/url-utils'

const TWEET_IDS = [
  '2016657648658403407',  // X 创作者认证 "绑卡" 指南
  '1942626551884841109',  // The Four Commandments of Reddit
  '2017113384681160822',  // 《Web 3求职你必须知道的真相》
]

async function main() {
  const client = createServiceRoleClient()

  console.log('========================================')
  console.log('Generating DeepSeek summaries for specific articles')
  console.log('========================================')

  for (const tweetId of TWEET_IDS) {
    console.log(`\n--- Tweet ID: ${tweetId} ---`)

    const { data: article, error } = await client
      .from('articles')
      .select('*')
      .eq('tweet_id', tweetId)
      .single()

    if (error || !article) {
      console.log(`  ERROR: ${error?.message || 'Not found'}`)
      continue
    }

    console.log(`  Title: ${article.title}`)
    console.log(`  Content length: ${article.full_article_content?.length || 0}`)

    // Check if already has summaries
    if (article.summary_chinese && article.summary_english) {
      console.log(`  ✓ Already has summaries, skipping...`)
      continue
    }

    const content = article.full_article_content || article.title

    try {
      console.log(`  Generating English summary...`)
      const englishResult = await generateReadingGuide(content, article.title)

      console.log(`  Translating to Chinese...`)
      const summary_chinese = await translateToChinese(englishResult.summary_english)

      const { error: updateError } = await client
        .from('articles')
        .update({
          summary_english: englishResult.summary_english,
          summary_chinese: summary_chinese,
          title_english: englishResult.title_english,
        })
        .eq('tweet_id', tweetId)

      if (updateError) {
        console.error(`  ✗ Update error:`, updateError)
      } else {
        console.log(`  ✓ Summary generated!`)
        console.log(`     English: ${englishResult.summary_english.slice(0, 80)}...`)
        console.log(`     Chinese: ${summary_chinese.slice(0, 80)}...`)
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`  ✗ Error: ${error}`)
    }
  }

  console.log('\n========================================')
  console.log('Done!')
  console.log('========================================')
}

main().catch(console.error)
